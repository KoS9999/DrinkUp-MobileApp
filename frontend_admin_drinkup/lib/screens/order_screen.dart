import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config.dart';

class OrderScreen extends StatefulWidget {
  const OrderScreen({super.key});

  @override
  _OrderScreenState createState() => _OrderScreenState();
}

class _OrderScreenState extends State<OrderScreen> {
  List<dynamic> _orders = [];
  int _page = 1;
  final int _limit = 10;
  bool _isLoading = false;
  bool _hasMore = true;
  final ScrollController _scrollController = ScrollController();

  // Filter states
  String? _selectedOrderStatus;
  String? _selectedPaymentStatus;

  @override
  void initState() {
    super.initState();
    _loadOrders();
    _scrollController.addListener(_scrollListener);
  }

  void _scrollListener() {
    if (_scrollController.position.pixels ==
        _scrollController.position.maxScrollExtent) {
      _loadMore();
    }
  }

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  Future<void> _loadOrders({bool loadMore = false}) async {
    if (_isLoading || (!_hasMore && loadMore)) return;

    setState(() => _isLoading = true);

    try {
      final token = await _getToken();
      final baseUri = Uri.parse(Config.baseUrl);

      final uri = Uri(
        scheme: baseUri.scheme,
        host: baseUri.host,
        port: baseUri.port,
        path: '${baseUri.path}/admin/orders',
        queryParameters: {
          'page': loadMore ? (_page + 1).toString() : _page.toString(),
          'limit': _limit.toString(),
          if (_selectedOrderStatus != null) 'status': _selectedOrderStatus,
          if (_selectedPaymentStatus != null)
            'paymentStatus': _selectedPaymentStatus,
        },
      );

      final response = await http.get(
        uri,
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          if (loadMore) {
            _orders.addAll(data['data']);
            _page++;
          } else {
            _orders = data['data'];
            _page = 1;
          }
          _hasMore = data['pagination']['page'] < data['pagination']['pages'];
          _isLoading = false;
        });
      } else {
        throw Exception('Failed to load orders: ${response.statusCode}');
      }
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi tải đơn hàng: ${e.toString()}')),
      );
    }
  }

  Future<void> _loadMore() => _loadOrders(loadMore: true);
  Future<void> _refresh() => _loadOrders();

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Text('Lọc đơn hàng'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: _selectedOrderStatus,
                  decoration: const InputDecoration(
                    labelText: 'Trạng thái đơn hàng',
                  ),
                  items: _orderStatusOptions,
                  onChanged:
                      (value) => setState(() => _selectedOrderStatus = value),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _selectedPaymentStatus,
                  decoration: const InputDecoration(
                    labelText: 'Trạng thái thanh toán',
                  ),
                  items: _paymentStatusOptions,
                  onChanged:
                      (value) => setState(() => _selectedPaymentStatus = value),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () {
                  setState(() {
                    _selectedOrderStatus = null;
                    _selectedPaymentStatus = null;
                  });
                  Navigator.pop(context);
                  _loadOrders();
                },
                child: const Text('Xóa bộ lọc'),
              ),
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  _loadOrders();
                },
                child: const Text('Áp dụng'),
              ),
            ],
          ),
    );
  }

  List<DropdownMenuItem<String>> get _orderStatusOptions =>
      [
            'new',
            'processing',
            'confirmed',
            'shipped',
            'delivered',
            'canceled',
            'cancel_request',
          ]
          .map(
            (status) => DropdownMenuItem(
              value: status,
              child: Text(_getOrderStatusText(status)),
            ),
          )
          .toList();

  final List<DropdownMenuItem<String>> _paymentStatusOptions =
      ['paid', 'unpaid']
          .map(
            (status) => DropdownMenuItem(
              value: status,
              child: Text(
                status == 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán',
              ),
            ),
          )
          .toList();

  String _getOrderStatusText(String status) {
    return const {
          'new': 'Mới',
          'processing': 'Đang xử lý',
          'confirmed': 'Đã xác nhận',
          'shipped': 'Đang giao hàng',
          'delivered': 'Đã giao',
          'canceled': 'Đã hủy',
          'cancel_request': 'Yêu cầu hủy',
        }[status] ??
        status;
  }

  Color _getOrderStatusColor(String status) {
    return const {
          'new': Colors.blue,
          'processing': Colors.orange,
          'confirmed': Colors.green,
          'shipped': Colors.purple,
          'delivered': Colors.teal,
          'canceled': Colors.red,
          'cancel_request': Colors.amber,
        }[status] ??
        Colors.grey;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Quản lý đơn hàng'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterDialog,
            tooltip: 'Bộ lọc',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView.builder(
          controller: _scrollController,
          itemCount: _orders.length + (_hasMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index >= _orders.length) {
              return _isLoading
                  ? const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Center(child: CircularProgressIndicator()),
                  )
                  : const SizedBox.shrink();
            }
            return _buildOrderItem(_orders[index]);
          },
        ),
      ),
    );
  }

  Widget _buildOrderItem(Map<String, dynamic> order) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200, width: 1),
      ),
      child: InkWell(
        onTap: () => _showOrderDetail(order['_id']),
        onLongPress: () => _showActionMenu(order),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Text(
                      'Đơn #${order['_id'].substring(0, 6)}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.blueGrey,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _getStatusBackgroundColor(order['orderStatus']),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _getOrderStatusText(order['orderStatus']),
                      style: TextStyle(
                        fontSize: 12,
                        color: _getOrderStatusColor(order['orderStatus']),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(
                    Icons.access_time,
                    size: 16,
                    color: Colors.grey.shade600,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    DateFormat(
                      'HH:mm - dd/MM/yyyy',
                    ).format(DateTime.parse(order['createdAt'])),
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Tổng tiền:',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade800,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    NumberFormat.currency(
                      locale: 'vi',
                      symbol: '₫',
                    ).format(order['finalPrice']),
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.deepOrange,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Divider(color: Colors.grey.shade200, height: 1),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildPaymentStatus(
                    status: order['paymentStatus'],
                    color:
                        order['paymentStatus'] == 'paid'
                            ? Colors.green
                            : Colors.orange,
                  ),
                  Icon(
                    Icons.chevron_right_rounded,
                    color: Colors.grey.shade400,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentStatus({required String status, required Color color}) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        Text(
          status == 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán',
          style: TextStyle(
            fontSize: 13,
            color: color,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Color _getStatusBackgroundColor(String status) {
    return const {
          'new': Color(0xFFE3F2FD),
          'processing': Color(0xFFFFF3E0),
          'confirmed': Color(0xFFE8F5E9),
          'shipped': Color(0xFFF3E5F5),
          'delivered': Color(0xFFE0F7FA),
          'canceled': Color(0xFFFFEBEE),
          'cancel_request': Color(0xFFFFF8E1),
        }[status] ??
        Colors.grey.shade100;
  }

  Widget _buildStatusChip({required String label, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_getStatusIcon(label), size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getStatusIcon(String status) {
    return const {
          'Mới': Icons.fiber_new_rounded,
          'Đang xử lý': Icons.autorenew_rounded,
          'Đã xác nhận': Icons.verified_rounded,
          'Đang giao hàng': Icons.local_shipping_rounded,
          'Đã giao': Icons.check_circle_rounded,
          'Đã hủy': Icons.cancel_rounded,
          'Yêu cầu hủy': Icons.warning_rounded,
        }[status] ??
        Icons.info_outline_rounded;
  }

  void _showActionMenu(Map<String, dynamic> order) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder:
          (context) => Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildActionMenuItem(
                    icon: Icons.edit,
                    label: 'Cập nhật trạng thái đơn hàng',
                    color: Colors.blue,
                    onTap: () {
                      Navigator.pop(context);
                      _showOrderStatusDialog(order);
                    },
                  ),
                  _buildActionMenuItem(
                    icon: Icons.payment,
                    label: 'Cập nhật trạng thái thanh toán',
                    color: Colors.green,
                    onTap: () {
                      Navigator.pop(context);
                      _showPaymentStatusDialog(order);
                    },
                  ),
                  const SizedBox(height: 8),
                  _buildActionMenuItem(
                    icon: Icons.close,
                    label: 'Đóng',
                    color: Colors.grey,
                    onTap: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildActionMenuItem({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(
        label,
        style: TextStyle(
          color: Colors.grey.shade800,
          fontWeight: FontWeight.w500,
        ),
      ),
      onTap: onTap,
    );
  }

  void _showOrderStatusDialog(Map<String, dynamic> order) {
    const statusTransitions = {
      'new': ['processing', 'canceled'],
      'processing': ['confirmed', 'canceled'],
      'confirmed': ['shipped', 'canceled'],
      'shipped': ['delivered'],
      'delivered': [],
      'canceled': [],
      'cancel_request': ['canceled'],
    };

    final currentStatus = order['orderStatus'];
    final availableStatuses = statusTransitions[currentStatus] ?? [];

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder:
          (context) => Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: ListView(
              shrinkWrap: true,
              padding: const EdgeInsets.only(top: 16, bottom: 32),
              children: [
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    'Chọn trạng thái mới',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Colors.blueGrey,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                ...availableStatuses
                    .map(
                      (status) => _buildStatusOption(
                        status: status,
                        order: order,
                        onTap:
                            () => _confirmStatusChange(
                              context: context,
                              orderId: order['_id'],
                              currentStatus: currentStatus,
                              newStatus: status,
                            ),
                      ),
                    )
                    .toList(),
              ],
            ),
          ),
    );
  }

  void _confirmStatusChange({
    required BuildContext context,
    required String orderId,
    required String currentStatus,
    required String newStatus,
  }) {
    final currentStatusText = _getOrderStatusText(currentStatus);
    final newStatusText = _getOrderStatusText(newStatus);

    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: const Text('Xác nhận thay đổi'),
            content: Text(
              'Bạn có chắc muốn đổi trạng thái từ '
              '$currentStatusText ➔ $newStatusText?',
              style: const TextStyle(fontSize: 15),
            ),
            actions: [
              TextButton(
                child: const Text('Hủy'),
                onPressed: () => Navigator.pop(context),
              ),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.green,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('Xác nhận'),
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.pop(context);
                  _updateOrderStatus(orderId, newStatus);
                },
              ),
            ],
          ),
    );
  }

  Widget _buildStatusOption({
    required String status,
    required Map<String, dynamic> order,
    required VoidCallback onTap,
  }) {
    final color = _getOrderStatusColor(status);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              ),
              const SizedBox(width: 16),
              Text(
                _getOrderStatusText(status),
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey.shade800,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Spacer(),
              if (status == order['orderStatus'])
                Icon(Icons.check, color: color, size: 20),
            ],
          ),
        ),
      ),
    );
  }

  void _showPaymentStatusDialog(Map<String, dynamic> order) {
    showModalBottomSheet(
      context: context,
      builder:
          (context) => SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Text(
                    'Cập nhật trạng thái thanh toán',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
                ListTile(
                  title: const Text('Đã thanh toán'),
                  trailing: const Icon(Icons.check_circle, color: Colors.green),
                  onTap: () => _updatePaymentStatus(order['_id'], 'paid'),
                ),
                ListTile(
                  title: const Text('Chưa thanh toán'),
                  trailing: const Icon(Icons.cancel, color: Colors.red),
                  onTap: () => _updatePaymentStatus(order['_id'], 'unpaid'),
                ),
              ],
            ),
          ),
    );
  }

  Future<void> _updateOrderStatus(String orderId, String newStatus) async {
    try {
      final token = await _getToken();
      final response = await http.put(
        Uri.parse('${Config.baseUrl}/admin/orders/$orderId/status'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({'newStatus': newStatus}),
      );

      if (response.statusCode == 200) {
        _refresh();
        _showSuccessSnackBar('Đã cập nhật trạng thái thành $newStatus');
      } else {
        throw Exception('Lỗi ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Lỗi cập nhật: ${e.toString()}')));
    }
  }

  Future<void> _updatePaymentStatus(String orderId, String newStatus) async {
    try {
      final token = await _getToken();
      final response = await http.put(
        Uri.parse('${Config.baseUrl}/admin/orders/$orderId/payment-status'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({'newPaymentStatus': newStatus}),
      );

      if (response.statusCode == 200) {
        _refresh();
        _showSuccessSnackBar('Đã cập nhật thanh toán thành $newStatus');
      } else {
        throw Exception('Lỗi ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Lỗi cập nhật: ${e.toString()}')));
    }
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

  void _showOrderDetail(String orderId) async {
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('${Config.baseUrl}/admin/orders/$orderId'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final order = json.decode(response.body)['data'];
        Navigator.push(
          context,
          MaterialPageRoute(
            builder:
                (context) => OrderDetailScreen(
                  order: order,
                  onPaymentStatusUpdated: _refresh,
                ),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi tải chi tiết: ${e.toString()}')),
      );
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }
}

class OrderDetailScreen extends StatelessWidget {
  final Map<String, dynamic> order;
  final VoidCallback onPaymentStatusUpdated;

  const OrderDetailScreen({
    super.key,
    required this.order,
    required this.onPaymentStatusUpdated,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Đơn hàng #${order['_id'].substring(0, 6).toUpperCase()}',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Colors.black54),
      ),
      body: Container(
        color: Colors.grey.shade50,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Thông tin chính
                    _buildInfoCard(
                      title: 'Thông tin đơn hàng',
                      children: [
                        _buildStatusRow(
                          'Trạng thái:',
                          _getOrderStatusText(order['orderStatus']),
                          _getOrderStatusColor(order['orderStatus']),
                        ),
                        _buildStatusRow(
                          'Thanh toán:',
                          order['paymentStatus'] == 'paid'
                              ? 'Đã thanh toán'
                              : 'Chưa thanh toán',
                          order['paymentStatus'] == 'paid'
                              ? Colors.green
                              : Colors.orange,
                        ),
                        _buildInfoRow(
                          'Phương thức:',
                          order['paymentMethod'] ?? 'Tiền mặt',
                          Colors.blueGrey.shade700,
                        ),
                        _buildInfoRow(
                          'Tổng tiền:',
                          NumberFormat.currency(
                            locale: 'vi',
                            symbol: '₫',
                          ).format(order['finalPrice']),
                          Colors.deepOrange.shade700,
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Danh sách sản phẩm
                    _buildInfoCard(
                      title: 'Chi tiết sản phẩm',
                      children:
                          order['details']
                              .map<Widget>(
                                (detail) => _buildProductItem(detail),
                              )
                              .toList(),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Helper methods
  Widget _buildInfoCard({
    required String title,
    required List<Widget> children,
  }) {
    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildStatusRow(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: color.withOpacity(0.3)),
            ),
            child: Text(
              value,
              style: TextStyle(
                color: color,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(
                fontSize: 14,
                color: color,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductItem(Map<String, dynamic> detail) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              detail['product']['imageUrl'],
              width: 70,
              height: 70,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  detail['product']['name'],
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Size: ${detail['size']} • Số lượng: ${detail['quantity']}',
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                ),
                if (detail['toppings'].isNotEmpty) ...[
                  const SizedBox(height: 5),
                  Wrap(
                    spacing: 6,
                    children:
                        detail['toppings']
                            .map<Widget>(
                              (topping) => Chip(
                                label: Text(
                                  '${topping['name']} (x${topping['quantity']})',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.grey.shade700,
                                  ),
                                ),
                                backgroundColor: Colors.grey.shade100,
                                visualDensity: VisualDensity.compact,
                              ),
                            )
                            .toList(),
                  ),
                ],
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                NumberFormat.currency(
                  locale: 'vi',
                  symbol: '₫',
                ).format(detail['price']),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.deepOrange.shade700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Các hàm helper cho trạng thái
  String _getOrderStatusText(String status) {
    return const {
          'new': 'Mới',
          'processing': 'Đang xử lý',
          'confirmed': 'Đã xác nhận',
          'shipped': 'Đang giao hàng',
          'delivered': 'Đã giao',
          'canceled': 'Đã hủy',
          'cancel_request': 'Yêu cầu hủy',
        }[status] ??
        status;
  }

  Color _getOrderStatusColor(String status) {
    return const {
          'new': Colors.blue,
          'processing': Colors.orange,
          'confirmed': Colors.green,
          'shipped': Colors.purple,
          'delivered': Colors.teal,
          'canceled': Colors.red,
          'cancel_request': Colors.amber,
        }[status] ??
        Colors.grey;
  }
}
