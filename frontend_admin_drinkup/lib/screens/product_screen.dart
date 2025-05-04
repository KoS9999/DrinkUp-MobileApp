import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http_parser/http_parser.dart';
import 'dart:convert';
import 'dart:io';
import '../config.dart';

class ProductScreen extends StatefulWidget {
  @override
  _ProductScreenState createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> {
  List<dynamic> _products = [];
  List<dynamic> _filteredProducts = [];
  List<dynamic> _categories = [];
  List<dynamic> _toppings = [];
  bool _isLoading = true;
  bool _isSubmitting = false;
  final _searchController = TextEditingController();
  File? _selectedImage;
  String? _currentImageUrl;

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    await Future.wait([_fetchProducts(), _fetchCategories(), _fetchToppings()]);
    setState(() => _isLoading = false);
  }

  //region API Functions
  Future<Map<String, String>> _getAuthHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    return {'Authorization': 'Bearer ${prefs.getString('token')}'};
  }

  Future<void> _fetchProducts() async {
    try {
      final response = await http.get(
        Uri.parse('${Config.baseUrl}/admin/products/products'),
        headers: await _getAuthHeaders(),
      );

      if (response.statusCode == 200) {
        setState(() {
          _products = json.decode(response.body);
          _filteredProducts = _products;
        });
      }
    } catch (e) {
      _showErrorSnackBar('Lỗi tải sản phẩm: ${e.toString()}');
    }
  }

  Future<void> _fetchCategories() async {
    try {
      final response = await http.get(
        Uri.parse('${Config.baseUrl}/admin/products/categories'),
        headers: await _getAuthHeaders(),
      );

      if (response.statusCode == 200) {
        setState(() => _categories = json.decode(response.body));
      }
    } catch (e) {
      _showErrorSnackBar('Lỗi tải danh mục: ${e.toString()}');
    }
  }

  Future<void> _fetchToppings() async {
    try {
      final response = await http.get(
        Uri.parse('${Config.baseUrl}/admin/products/toppings'),
        headers: await _getAuthHeaders(),
      );

      if (response.statusCode == 200) {
        setState(() => _toppings = json.decode(response.body));
      }
    } catch (e) {
      _showErrorSnackBar('Lỗi tải topping: ${e.toString()}');
    }
  }

  Future<void> _deleteProduct(String id) async {
    try {
      final response = await http.delete(
        Uri.parse('${Config.baseUrl}/admin/products/$id'),
        headers: await _getAuthHeaders(),
      );

      if (response.statusCode == 200) {
        _showSuccessSnackBar('Đã xóa sản phẩm thành công');
        await _fetchProducts();
      }
    } catch (e) {
      _showErrorSnackBar('Lỗi xóa sản phẩm: ${e.toString()}');
    }
  }
  //endregion

  //region Image Handling
  Future<void> _handleImageSelection() async {
    final pickedFile = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 70,
      maxWidth: 800,
    );
    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
        _currentImageUrl = null;
      });
    }
  }

  Widget _buildImagePreview(File image) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(15),
      child: Image.file(image, fit: BoxFit.cover),
    );
  }

  Widget _buildNetworkImage(String url) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(15),
      child: Image.network(url, fit: BoxFit.cover),
    );
  }
  //endregion

  //region Form Validation
  String? _validateRequired(String? value) {
    if (value == null || value.isEmpty) return 'Trường này là bắt buộc';
    return null;
  }

  String? _validatePrice(String? value, String fieldName) {
    if (value == null || value.isEmpty) return 'Vui lòng nhập $fieldName';
    final numericValue = double.tryParse(value.replaceAll('.', ''));
    if (numericValue == null) return '$fieldName phải là số';
    if (numericValue <= 0) return '$fieldName phải lớn hơn 0';
    return null;
  }
  //endregion

  //region UI Components
  Widget _buildCategoryDropdown(
    String? selectedValue,
    StateSetter setState,
    Function(String?) onCategoryChanged,
  ) {
    return FormField<String>(
      initialValue: selectedValue,
      builder: (FormFieldState<String> state) {
        return InputDecorator(
          decoration: InputDecoration(
            labelText: 'Danh mục',
            border: OutlineInputBorder(),
            errorText: state.errorText,
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: state.value,
              isExpanded: true,
              items:
                  _categories.map<DropdownMenuItem<String>>((category) {
                    return DropdownMenuItem<String>(
                      value: category['_id'].toString(),
                      child: Text(category['name'] ?? 'Chưa đặt tên'),
                    );
                  }).toList(),
              onChanged: (String? newValue) {
                setState(() {
                  state.didChange(newValue);
                });
                onCategoryChanged(newValue);
              },
            ),
          ),
        );
      },
      validator: (value) => value == null ? 'Vui lòng chọn danh mục' : null,
    );
  }

  Widget _buildToppingsSelection(List<String> selected, StateSetter setState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.only(bottom: 8),
          child: Text(
            'Toppings',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.brown[700],
            ),
          ),
        ),
        Wrap(
          spacing: 8,
          children:
              _toppings.map<Widget>((topping) {
                final isSelected = selected.contains(topping['_id']);
                return FilterChip(
                  label: Text(topping['name'] ?? ''),
                  selected: isSelected,
                  onSelected:
                      (value) => setState(() {
                        if (value) {
                          selected.add(topping['_id']);
                        } else {
                          selected.remove(topping['_id']);
                        }
                      }),
                  selectedColor: Colors.brown[100],
                  checkmarkColor: Colors.brown,
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.brown[800] : Colors.grey[700],
                  ),
                );
              }).toList(),
        ),
      ],
    );
  }

  Widget _buildPriceField(String label, TextEditingController controller) {
    return Expanded(
      child: TextFormField(
        controller: controller,
        keyboardType: TextInputType.number,
        inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(),
          prefixText: 'đ ',
          prefixStyle: TextStyle(color: Colors.brown),
          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          filled: true,
          fillColor: Colors.grey[50],
        ),
        style: TextStyle(fontSize: 16),
        validator: (value) => _validatePrice(value, label),
        onChanged: (value) {
          if (value.isNotEmpty) {
            final cleanValue = value.replaceAll('.', '');
            final numValue = int.tryParse(cleanValue) ?? 0;
            controller.text = _formatPrice(numValue.toString());
            controller.selection = TextSelection.collapsed(
              offset: controller.text.length,
            );
          }
        },
      ),
    );
  }

  void _filterProducts(String query) {
    setState(() {
      _filteredProducts =
          _products.where((product) {
            final name = product['name'].toString().toLowerCase();
            return name.contains(query.toLowerCase());
          }).toList();
    });
  }
  //endregion

  void _showProductForm({dynamic product}) {
    final _formKey = GlobalKey<FormState>();
    final _nameController = TextEditingController(text: product?['name']);
    final _descController = TextEditingController(
      text: product?['description'],
    );
    final _priceSController = TextEditingController(
      text: product?['price']?['S']?.toString() ?? '',
    );
    final _priceMController = TextEditingController(
      text: product?['price']?['M']?.toString() ?? '',
    );
    final _priceLController = TextEditingController(
      text: product?['price']?['L']?.toString() ?? '',
    );
    String? _selectedCategory =
        product != null
            ? (product['category'] is Map<String, dynamic>
                ? product['category']['_id'].toString()
                : product['category'].toString())
            : null;

    List<String> _selectedToppings = List.from(
      product?['toppings']?.map((t) => t['_id']) ?? [],
    );
    _currentImageUrl = product?['imageUrl'];

    showDialog(
      context: context,
      builder:
          (context) => StatefulBuilder(
            builder:
                (context, setState) => AlertDialog(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  title: Text(
                    product == null
                        ? 'Thêm mới sản phẩm'
                        : 'Chỉnh sửa sản phẩm',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.brown[800],
                    ),
                  ),
                  content: SingleChildScrollView(
                    child: Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          _buildImageSection(setState, product),
                          SizedBox(height: 20),
                          _buildTextFormField(
                            _nameController,
                            'Tên sản phẩm',
                            validator: (value) => _validateRequired(value),
                          ),
                          _buildTextFormField(
                            _descController,
                            'Mô tả',
                            maxLines: 3,
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Giá các size',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey[600],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                SizedBox(height: 8),
                                Row(
                                  children: [
                                    _buildPriceField(
                                      'Size S',
                                      _priceSController,
                                    ),
                                    SizedBox(width: 10),
                                    _buildPriceField(
                                      'Size M',
                                      _priceMController,
                                    ),
                                    SizedBox(width: 10),
                                    _buildPriceField(
                                      'Size L',
                                      _priceLController,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          SizedBox(height: 15),
                          _buildCategoryDropdown(
                            _selectedCategory,
                            setState,
                            (newValue) => _selectedCategory = newValue,
                          ),
                          SizedBox(height: 15),
                          _buildToppingsSelection(_selectedToppings, setState),
                        ],
                      ),
                    ),
                  ),
                  actions: [
                    TextButton(
                      onPressed:
                          _isSubmitting ? null : () => Navigator.pop(context),
                      child: Text('HỦY', style: TextStyle(color: Colors.red)),
                    ), // <-- thêm dấu phẩy ở đây
                    ElevatedButton(
                      onPressed:
                          _isSubmitting
                              ? null
                              : () => _handleFormSubmission(
                                _formKey,
                                _nameController,
                                _descController,
                                _priceSController,
                                _priceMController,
                                _priceLController,
                                _selectedCategory!,
                                _selectedToppings,
                                product?['_id'],
                              ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.brown[600],
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 12,
                        ),
                      ),
                      child:
                          _isSubmitting
                              ? SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                              : Text(
                                'LƯU',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                    ),
                  ],
                ),
          ),
    );
  }

  Widget _buildImageSection(StateSetter setState, dynamic product) {
    return Column(
      children: [
        GestureDetector(
          onTap: _handleImageSelection,
          child: Container(
            height: 150,
            width: 150,
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(15),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child:
                _selectedImage != null
                    ? _buildImagePreview(_selectedImage!)
                    : _currentImageUrl != null
                    ? _buildNetworkImage(_currentImageUrl!)
                    : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.add_a_photo, size: 40, color: Colors.grey),
                        SizedBox(height: 10),
                        Text('Thêm ảnh', style: TextStyle(color: Colors.grey)),
                      ],
                    ),
          ),
        ),
        if (_selectedImage != null)
          TextButton(
            onPressed: () => setState(() => _selectedImage = null),
            child: Text('Xóa ảnh', style: TextStyle(color: Colors.red)),
          ),
      ],
    );
  }

  Widget _buildTextFormField(
    TextEditingController controller,
    String label, {
    int? maxLines,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: TextFormField(
        controller: controller,
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(),
          contentPadding: EdgeInsets.symmetric(horizontal: 15, vertical: 14),
          filled: true,
          fillColor: Colors.grey[50],
        ),
        maxLines: maxLines ?? 1,
        style: TextStyle(fontSize: 16),
        validator: validator,
      ),
    );
  }

  Future<void> _handleFormSubmission(
    GlobalKey<FormState> formKey,
    TextEditingController nameController,
    TextEditingController descController,
    TextEditingController priceSController,
    TextEditingController priceMController,
    TextEditingController priceLController,
    String category,
    List<String> toppings,
    String? productId,
  ) async {
    if (formKey.currentState!.validate()) {
      try {
        setState(() => _isSubmitting = true);

        // Validate và chuyển đổi giá
        final priceS =
            double.tryParse(priceSController.text.replaceAll('.', '')) ?? 0;
        final priceM =
            double.tryParse(priceMController.text.replaceAll('.', '')) ?? 0;
        final priceL =
            double.tryParse(priceLController.text.replaceAll('.', '')) ?? 0;

        if (priceS <= 0 || priceM <= 0 || priceL <= 0) {
          _showErrorSnackBar('Giá phải lớn hơn 0');
          return;
        }

        // Tạo request
        final url = Uri.parse(
          '${Config.baseUrl}/admin/products${productId != null ? '/$productId' : ''}',
        );
        final request = http.MultipartRequest(
          productId != null ? 'PUT' : 'POST',
          url,
        );

        // Thêm headers và fields
        request.headers.addAll(await _getAuthHeaders());
        request.fields.addAll({
          'name': nameController.text,
          'description': descController.text,
          'price': json.encode({'S': priceS, 'M': priceM, 'L': priceL}),
          'category': category,
          'toppings': json.encode(toppings),
        });

        // Xử lý ảnh
        if (_selectedImage != null) {
          request.files.add(
            await http.MultipartFile.fromPath(
              'image',
              _selectedImage!.path,
              contentType: MediaType('image', 'jpeg'),
            ),
          );
        }

        // Gửi request
        final response = await request.send();
        final responseBody = await response.stream.bytesToString();

        if (response.statusCode >= 200 && response.statusCode < 300) {
          Navigator.pop(context);
          await _fetchProducts();
          _showSuccessSnackBar(
            productId != null ? 'Cập nhật thành công!' : 'Thêm mới thành công!',
          );
        } else {
          final errorData = json.decode(responseBody);
          _showErrorSnackBar(errorData['message'] ?? 'Lỗi không xác định');
        }
      } catch (e) {
        _showErrorSnackBar('Lỗi hệ thống: ${e.toString()}');
      } finally {
        setState(() => _isSubmitting = false);
      }
    }
  }

  Widget _buildProductItem(dynamic product) {
    return Card(
      elevation: 2,
      margin: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: ListTile(
        contentPadding: EdgeInsets.all(12),
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child:
              product['imageUrl'] != null
                  ? Image.network(
                    product['imageUrl'],
                    width: 60,
                    height: 60,
                    fit: BoxFit.cover,
                  )
                  : Container(
                    width: 60,
                    height: 60,
                    color: Colors.grey[100],
                    child: Icon(Icons.coffee, color: Colors.grey),
                  ),
        ),
        title: Text(
          product['name'],
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 16,
            color: Colors.brown[800],
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: 4),
            _buildPriceDisplay(product['price']),
            SizedBox(height: 4),
            Text(
              'Danh mục: ${product['category']?['name'] ?? 'Chưa phân loại'}',
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
            if (product['toppings']?.isNotEmpty ?? false)
              Padding(
                padding: EdgeInsets.only(top: 4),
                child: Text(
                  'Toppings: ${product['toppings']?.map((t) => t['name']).join(', ')}',
                  style: TextStyle(fontSize: 12, color: Colors.brown[400]),
                ),
              ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: Icon(Icons.edit, color: Colors.brown),
              onPressed: () => _showProductForm(product: product),
            ),
            IconButton(
              icon: Icon(Icons.delete, color: Colors.red[300]),
              onPressed: () => _confirmDeleteProduct(product['_id']),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceDisplay(dynamic price) {
    if (price is Map) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildPriceRow('S', price['S']),
          _buildPriceRow('M', price['M']),
          _buildPriceRow('L', price['L']),
        ],
      );
    }
    return Text('${_formatPrice(price)}đ');
  }

  Widget _buildPriceRow(String size, dynamic price) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Text(
            '$size:',
            style: TextStyle(
              color: Colors.brown[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(width: 6),
          Text(
            '${_formatPrice(price)}đ',
            style: TextStyle(color: Colors.grey[700]),
          ),
        ],
      ),
    );
  }

  String _formatPrice(dynamic price) {
    final number =
        price is String
            ? double.tryParse(price) ?? 0
            : (price is int ? price.toDouble() : price);
    return number
        .toStringAsFixed(0)
        .replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (match) => '${match[1]}.',
        );
  }

  Future<void> _confirmDeleteProduct(String id) async {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: Text(
              'Xác nhận xóa',
              style: TextStyle(color: Colors.red[700]),
            ),
            content: Text('Bạn chắc chắn muốn xóa sản phẩm này?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text('Hủy', style: TextStyle(color: Colors.grey)),
              ), // Thêm dấu phẩy ở đây
              TextButton(
                onPressed: () async {
                  Navigator.of(context).pop();
                  try {
                    await _deleteProduct(id);
                  } catch (e) {
                    _showErrorSnackBar('Lỗi khi xóa: ${e.toString()}');
                  }
                },
                child: Text('Xóa', style: TextStyle(color: Colors.red)),
              ),
            ],
          ),
    );
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green[700],
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  void _showErrorSnackBar(String error) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(error),
        backgroundColor: Colors.red[700],
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Quản Lý Thực Đơn',
          style: TextStyle(
            color: Colors.brown[800],
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh, color: Colors.brown),
            onPressed: _initializeData,
          ),
        ],
        backgroundColor: Colors.brown[50],
        elevation: 1,
      ),
      floatingActionButton: FloatingActionButton.extended(
        icon: Icon(Icons.add, color: Colors.white),
        label: Text('Thêm mới', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.brown[600],
        onPressed: () => _showProductForm(),
      ),
      body:
          _isLoading
              ? Center(child: CircularProgressIndicator(color: Colors.brown))
              : Column(
                children: [
                  Padding(
                    padding: EdgeInsets.all(16),
                    child: TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: 'Tìm kiếm sản phẩm...',
                        prefixIcon: Icon(Icons.search, color: Colors.grey),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(30),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: Colors.grey[100],
                        contentPadding: EdgeInsets.symmetric(horizontal: 24),
                      ),
                      onChanged: _filterProducts,
                    ),
                  ),
                  Expanded(
                    child: RefreshIndicator(
                      onRefresh: _initializeData,
                      color: Colors.brown,
                      child: ListView.builder(
                        physics: AlwaysScrollableScrollPhysics(),
                        itemCount: _filteredProducts.length,
                        itemBuilder:
                            (context, index) =>
                                _buildProductItem(_filteredProducts[index]),
                      ),
                    ),
                  ),
                ],
              ),
    );
  }
}
