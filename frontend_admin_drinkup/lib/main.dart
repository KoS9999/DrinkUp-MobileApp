import 'package:flutter/material.dart';
import 'screens/intro_screen.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/register_screen.dart';
import 'screens/forgotpassword_screen.dart';
import 'screens/product_screen.dart';
import 'screens/order_screen.dart';
import 'screens/user_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Admin App',
      theme: ThemeData(primarySwatch: Colors.blue),
      initialRoute: '/',
      routes: {
        '/': (context) => IntroScreen(),
        '/login': (context) => LoginScreen(),
        '/home': (context) => HomeScreen(),
        '/forgotpassword': (context) => ForgotPasswordScreen(),
        '/register': (context) => RegisterScreen(),
        '/products': (context) => ProductScreen(),
        '/orders': (context) => OrderScreen(),
        '/users': (context) => UserScreen(),
      },
    );
  }
}
