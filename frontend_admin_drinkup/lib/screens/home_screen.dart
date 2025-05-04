// ignore_for_file: deprecated_member_use
import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'package:shared_preferences/shared_preferences.dart';

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(
          'Coffee Manager Dashboard',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        backgroundColor: Color(0xFF6F4E37),
        elevation: 0,
        centerTitle: true,
        actions: [
          IconButton(
            icon: Icon(Icons.notifications, color: Colors.white),
            onPressed: () {},
          ),
          PopupMenuButton<String>(
            icon: Icon(Icons.account_circle, color: Colors.white),
            onSelected: (value) {
              if (value == 'logout') {
                // Xử lý logout
                _logout(context);
              }
            },
            itemBuilder: (BuildContext context) {
              return {'Logout': 'logout'}.entries.map((entry) {
                return PopupMenuItem<String>(
                  value: entry.value,
                  child: Text(entry.key),
                );
              }).toList();
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildWelcomeCard(context),
            SizedBox(height: 24),

            _buildStatsRow(),
            SizedBox(height: 24),

            _buildFeaturesGrid(context),
            SizedBox(height: 24),

            _buildRecentActivity(),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: Color(0xFFD4A76A),
        child: Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildWelcomeCard(BuildContext context) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF6F4E37), Color(0xFF4B3621)],
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Xin chào, Quản trị viên!',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Quản lý quán cà phê của bạn một cách hiệu quả',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white.withOpacity(0.9),
              ),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFFD4A76A),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: Text(
                'Xem báo cáo hôm nay',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsRow() {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            icon: Iconsax.coffee,
            value: '24',
            label: 'Đơn hàng mới',
            color: Color(0xFF6F4E37),
          ),
        ),
        SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            icon: Iconsax.money,
            value: '5.2tr',
            label: 'Doanh thu',
            color: Color(0xFF4CAF50),
          ),
        ),
        SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            icon: Iconsax.user,
            value: '42',
            label: 'Khách hàng',
            color: Color(0xFF2196F3),
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String value,
    required String label,
    required Color color,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Container(
              padding: EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            SizedBox(height: 12),
            Text(
              value,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 4),
            Text(label, style: TextStyle(color: Colors.grey[600])),
          ],
        ),
      ),
    );
  }

  Widget _buildFeaturesGrid(BuildContext context) {
    final features = [
      {
        'icon': Iconsax.coffee,
        'title': 'Sản phẩm',
        'route': '/products',
        'color': Color(0xFF6F4E37),
      },
      {
        'icon': Iconsax.receipt,
        'title': 'Đơn hàng',
        'route': '/orders',
        'color': Color(0xFF2196F3),
      },
      {
        'icon': Iconsax.user,
        'title': 'Khách hàng',
        'route': '/users',
        'color': Color(0xFF9C27B0),
      },
      {
        'icon': Iconsax.money,
        'title': 'Thanh toán',
        'route': '/payments',
        'color': Color(0xFF4CAF50),
      },
      {
        'icon': Iconsax.chart,
        'title': 'Báo cáo',
        'route': '/reports',
        'color': Color(0xFFFF9800),
      },
      {
        'icon': Iconsax.setting,
        'title': 'Cài đặt',
        'route': '/settings',
        'color': Color(0xFF607D8B),
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.2,
      ),
      itemCount: features.length,
      itemBuilder: (context, index) {
        final feature = features[index];
        return Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: () {
              Navigator.pushNamed(context, feature['route'] as String);
            },
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color:
                          feature['color'] as Color? ??
                          Colors.blue.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      feature['icon'] as IconData? ?? Iconsax.coffee,
                      color: feature['color'] as Color? ?? Colors.blue,
                      size: 28,
                    ),
                  ),
                  SizedBox(height: 12),
                  Text(
                    feature['title'] as String? ?? '',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildRecentActivity() {
    final activities = [
      {
        'time': '5 phút trước',
        'action': 'Đơn hàng #1234 đã thanh toán',
        'icon': Iconsax.receipt,
      },
      {
        'time': '12 phút trước',
        'action': 'Sản phẩm "Cappuccino" đã cập nhật',
        'icon': Iconsax.coffee,
      },
      {
        'time': '30 phút trước',
        'action': 'Khách hàng mới đăng ký',
        'icon': Iconsax.user_add,
      },
      {
        'time': '2 giờ trước',
        'action': 'Báo cáo doanh thu ngày đã tạo',
        'icon': Iconsax.chart,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Hoạt động gần đây',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 12),
        Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              children:
                  activities
                      .map(
                        (activity) => ListTile(
                          leading: Container(
                            padding: EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Color(0xFF6F4E37).withOpacity(0.2),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              activity['icon'] as IconData? ?? Iconsax.activity,
                              color: Color(0xFF6F4E37),
                              size: 20,
                            ),
                          ),
                          title: Text(activity['action'] as String? ?? ''),
                          subtitle: Text(
                            activity['time'] as String? ?? '',
                            style: TextStyle(color: Colors.grey),
                          ),
                          trailing: Icon(
                            Icons.chevron_right,
                            color: Colors.grey,
                          ),
                        ),
                      )
                      .toList(),
            ),
          ),
        ),
      ],
    );
  }

  void _logout(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder:
          (context) => AlertDialog(
            title: Text('Xác nhận'),
            content: Text('Bạn có chắc chắn muốn đăng xuất?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: Text('Hủy'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context, true),
                child: Text('Đăng xuất'),
              ),
            ],
          ),
    );

    if (confirmed == true) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');

      Navigator.pushNamedAndRemoveUntil(
        context,
        '/login',
        (Route<dynamic> route) => false,
      );
    }
  }
}
