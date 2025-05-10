import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config.dart';
import 'dart:async';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  _ForgotPasswordScreenState createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();
  final List<TextEditingController> _otpControllers = List.generate(
    6,
    (index) => TextEditingController(),
  );
  int _countdown = 300;
  late Timer _timer;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  void _startCountdown() {
    const oneSec = Duration(seconds: 1);
    _timer = Timer.periodic(oneSec, (Timer timer) {
      if (_countdown < 1) {
        timer.cancel();
      } else {
        setState(() {
          _countdown--;
        });
      }
    });
  }

  String _formatCountdown() {
    final minutes = (_countdown ~/ 60).toString().padLeft(2, '0');
    final seconds = (_countdown % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  final List<FocusNode> _otpFocusNodes = List.generate(6, (index) => FocusNode());

  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isOtpSent = false;

  Future<void> _handleResetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final url = '${Config.baseUrl}/auth/forgot-password';
    final otp = _otpControllers.map((c) => c.text).join();

    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': _emailController.text,
          'newPassword': _newPasswordController.text,
          'confirmPassword': _confirmPasswordController.text,
          'otp': _isOtpSent ? otp : null,
        }),
      );

      final responseBody = json.decode(response.body);
      if (response.statusCode == 200) {
        if (!_isOtpSent) {
          setState(() {
            _isOtpSent = true;
            _countdown = 300;
          });
          _startCountdown();
          _showSnackBar('Mã OTP đã được gửi đến email của bạn', Colors.green);
        } else {
          Navigator.pop(context);
          _showSnackBar('Đặt lại mật khẩu thành công!', Colors.green);
        }
      } else {
        _showSnackBar(
          responseBody['message'] ?? 'Lỗi không xác định',
          Colors.red,
        );
      }
    } catch (e) {
      _showSnackBar('Lỗi kết nối: $e', Colors.red);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  Widget _buildOtpInput() {
    return Column(
      children: [
        Text(
          'Nhập mã OTP 6 số',
          style: TextStyle(color: Colors.white70, fontSize: 16),
        ),
        SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: List.generate(6, (index) {
            return SizedBox(
              width: 45,
              child: TextFormField(
                controller: _otpControllers[index],
                focusNode: _otpFocusNodes[index],
                textAlign: TextAlign.center,
                keyboardType: TextInputType.number,
                maxLength: 1,
                style: TextStyle(color: Colors.white, fontSize: 20),
                decoration: InputDecoration(
                  counterText: '',
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.1),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: Colors.white54),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: Color(0xFFD4A76A), width: 2),
                  ),
                ),
                onChanged: (value) {
                  if (value.length == 1) {
                    if (index < 5) {
                      FocusScope.of(
                        context,
                      ).requestFocus(_otpFocusNodes[index + 1]);
                    }
                  } else if (value.isEmpty) {
                    if (index > 0) {
                      FocusScope.of(
                        context,
                      ).requestFocus(_otpFocusNodes[index - 1]);
                    }
                  }
                },
                validator: (value) => value!.isEmpty ? '' : null,
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String labelText,
    required IconData prefixIcon,
    bool obscureText = false,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    Widget? suffixIcon,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      style: TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: labelText,
        labelStyle: TextStyle(color: Colors.white70),
        prefixIcon: Icon(prefixIcon, color: Colors.white70),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: Colors.white.withOpacity(0.1),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.white54),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Color(0xFFD4A76A), width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.red),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.red, width: 2),
        ),
        errorStyle: TextStyle(color: Colors.red[200]),
      ),
      validator: validator,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF6F4E37), Color(0xFF4B3621)],
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock_reset, size: 80, color: Colors.white70),
                  SizedBox(height: 16),
                  Text(
                    'Quên mật khẩu',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 40),

                  if (!_isOtpSent)
                    _buildInputField(
                      controller: _emailController,
                      labelText: 'Email',
                      prefixIcon: Icons.email,
                      keyboardType: TextInputType.emailAddress,
                      validator:
                          (value) =>
                              !value!.contains('@')
                                  ? 'Email không hợp lệ'
                                  : null,
                    ),

                  if (_isOtpSent) ...[
                    _buildInputField(
                      controller: _newPasswordController,
                      labelText: 'Mật khẩu mới',
                      prefixIcon: Icons.lock,
                      obscureText: _obscurePassword,
                      validator:
                          (value) =>
                              value!.length < 6
                                  ? 'Mật khẩu ít nhất 6 ký tự'
                                  : null,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_off
                              : Icons.visibility,
                          color: Colors.white70,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                    ),
                    SizedBox(height: 16),
                    _buildInputField(
                      controller: _confirmPasswordController,
                      labelText: 'Xác nhận mật khẩu',
                      prefixIcon: Icons.lock_outline,
                      obscureText: _obscureConfirmPassword,
                      validator:
                          (value) =>
                              value != _newPasswordController.text
                                  ? 'Mật khẩu không khớp'
                                  : null,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureConfirmPassword
                              ? Icons.visibility_off
                              : Icons.visibility,
                          color: Colors.white70,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscureConfirmPassword = !_obscureConfirmPassword;
                          });
                        },
                      ),
                    ),
                    SizedBox(height: 16),
                    _buildOtpInput(),
                    SizedBox(height: 8),
                    Text(
                      _countdown > 0
                          ? 'Mã OTP hết hạn sau ${_formatCountdown()}'
                          : 'Mã OTP đã hết hạn',
                      style: TextStyle(
                        color:
                            _countdown > 60
                                ? Colors.white70
                                : _countdown > 30
                                ? Colors.orange
                                : Colors.red,
                        fontSize: 14,
                      ),
                    ),
                  ],

                  SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleResetPassword,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(0xFFD4A76A),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        elevation: 5,
                        shadowColor: Colors.black.withOpacity(0.3),
                      ),
                      child:
                          _isLoading
                              ? CircularProgressIndicator(color: Colors.white)
                              : Text(
                                _isOtpSent ? 'ĐẶT LẠI MẬT KHẨU' : 'GỬI OTP',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                    ),
                  ),
                  SizedBox(height: 16),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    style: TextButton.styleFrom(
                      padding: EdgeInsets.zero,
                      minimumSize: Size(50, 30),
                    ),
                    child: Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(
                            text: 'Quay lại ',
                            style: TextStyle(color: Colors.white70),
                          ),
                          TextSpan(
                            text: 'đăng nhập',
                            style: TextStyle(
                              color: Color(0xFFD4A76A),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
