const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Topping = require('../models/Topping');
const { uploadImageToFirebase } = require('../services/firebaseService');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('toppings', 'name price')
      .sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách sản phẩm', error: err.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách danh mục', error: err.message });
  }
};

exports.getAllToppings = async (req, res) => {
  try {
    const toppings = await Topping.find();
    res.status(200).json(toppings);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách topping', error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    res.status(200).json({ message: 'Đã xóa sản phẩm thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi xóa sản phẩm', error: err.message });
  }
};




exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, price, toppings } = req.body;
    const file = req.file;

    if (!name) {
      return res.status(400).json({ message: 'Tên sản phẩm là bắt buộc' });
    }

    if (!category || !mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: 'Danh mục không hợp lệ' });
    }

    let productPrice;
    if (!price) {
      return res.status(400).json({ 
        message: 'Giá sản phẩm là bắt buộc',
        example: '{"S": 29000, "M": 35000, "L": 40000}'
      });
    }

    try {
      productPrice = JSON.parse(price);
      if (!productPrice.S || !productPrice.M || !productPrice.L) {
        throw new Error('Thiếu giá cho một hoặc nhiều kích cỡ');
      }

      productPrice.S = Number(productPrice.S);
      productPrice.M = Number(productPrice.M);
      productPrice.L = Number(productPrice.L);

      if (isNaN(productPrice.S) || isNaN(productPrice.M) || isNaN(productPrice.L)) {
        throw new Error('Giá phải là số');
      }
    } catch (e) {
      return res.status(400).json({
        message: 'Định dạng giá không hợp lệ',
        error: e.message,
        example: '{"S": 29000, "M": 35000, "L": 40000}'
      });
    }

    let imageUrl = '';
    if (file) {
      try {
        imageUrl = await uploadImageToFirebase(file);
      } catch (uploadError) {
        return res.status(500).json({
          message: 'Lỗi upload ảnh',
          error: uploadError.message
        });
      }
    }

    let productToppings = [];
    if (toppings) {
      try {
        const parsedToppings = JSON.parse(toppings);
        if (!Array.isArray(parsedToppings)) {
          throw new Error('Toppings phải là mảng ID');
        }
        
        parsedToppings.forEach(t => {
          if (!mongoose.Types.ObjectId.isValid(t)) {
            throw new Error(`ID topping không hợp lệ: ${t}`);
          }
        });
        
        productToppings = parsedToppings.map(t => new mongoose.Types.ObjectId(t));
      } catch (e) {
        return res.status(400).json({
          message: 'Định dạng toppings không hợp lệ',
          error: e.message
        });
      }
    }

    const newProduct = new Product({
      name,
      description: description || '',
      price: productPrice,
      category: new mongoose.Types.ObjectId(category),
      imageUrl,
      toppings: productToppings
    });

    const savedProduct = await newProduct.save();
    
    const populatedProduct = await Product.findById(savedProduct._id)
      .populate('category toppings');

    res.status(201).json(populatedProduct);

  } catch (error) {
    console.error('Create product error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Lỗi server khi tạo sản phẩm';

    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = 'Dữ liệu không hợp lệ';
    }

    res.status(statusCode).json({
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const file = req.file;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    const updateData = {
      name: product.name,
      description: product.description,
      price: { ...product.price },
      category: product.category,
      imageUrl: product.imageUrl,
      toppings: [...product.toppings],
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.description) updateData.description = updates.description;

    if (updates.price) {
      try {
        const newPrice = JSON.parse(updates.price);
        updateData.price = {
          S: Number.isFinite(newPrice.S) ? newPrice.S : updateData.price.S,
          M: Number.isFinite(newPrice.M) ? newPrice.M : updateData.price.M,
          L: Number.isFinite(newPrice.L) ? newPrice.L : updateData.price.L,
        };
      } catch (e) {
        return res.status(400).json({
          message: 'Định dạng giá không hợp lệ',
          example: '{"S": 29000, "M": 35000, "L": 40000}',
        });
      }
    }

    if (updates.category) {
      if (!mongoose.Types.ObjectId.isValid(updates.category)) {
        return res.status(400).json({ message: 'ID danh mục không hợp lệ' });
      }
      updateData.category = new mongoose.Types.ObjectId(updates.category);
    }

    if (file) {
      try {
        updateData.imageUrl = await uploadImageToFirebase(file);
      } catch (uploadError) {
        return res.status(500).json({
          message: 'Lỗi upload ảnh',
          error: uploadError.message,
        });
      }
    }

    if (updates.toppings) {
      try {
        const parsedToppings = JSON.parse(updates.toppings);
        if (!Array.isArray(parsedToppings)) {
          return res.status(400).json({ message: 'Toppings phải là mảng ID' });
        }
        
        parsedToppings.forEach(t => {
          if (!mongoose.Types.ObjectId.isValid(t)) {
            throw new Error(`ID topping không hợp lệ: ${t}`);
          }
        });
        
        updateData.toppings = parsedToppings.map(t => new mongoose.Types.ObjectId(t));
      } catch (e) {
        return res.status(400).json({
          message: 'Định dạng toppings không hợp lệ',
          error: e.message,
        });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate('category toppings');

    res.status(200).json(updatedProduct);

  } catch (error) {
    console.error('Update product error:', error); 
    
    let statusCode = 500;
    let errorMessage = 'Lỗi server khi cập nhật sản phẩm';

    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = 'Dữ liệu không hợp lệ';
    }

    res.status(statusCode).json({
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};


