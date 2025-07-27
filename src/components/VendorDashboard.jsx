import React, { useState, useEffect } from 'react';
import { ShoppingCart, Users, BarChart3, Package, Search, Filter, Star, Phone, Mail, MapPin, Clock, Zap, AlertCircle, X } from 'lucide-react';

const VendorDashboard = ({ user, setUser }) => {
  const [products, setProducts] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [showProductBrowser, setShowProductBrowser] = useState(false);
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [orderForm, setOrderForm] = useState({
    quantity: '',
    notes: '',
    urgency: 'medium'
  });

  // Form state for posting requirements
  const [requirementForm, setRequirementForm] = useState({
    productName: '',
    quantity: '',
    unit: 'kg',
    maxPrice: '',
    description: '',
    category: '',
    urgency: 'medium',
    deadline: ''
  });

  const backendUrl = 'http://localhost:5000';

  // Mock data for dashboard stats (these could be fetched from API)
  const recentOrders = [
    { item: 'Onions - 10kg', farmer: 'Ramesh Farm Fresh', status: 'Delivered', amount: '₹320' },
    { item: 'Tomatoes - 5kg', farmer: 'Krishnan Organics', status: 'In Transit', amount: '₹200' },
    { item: 'Green Chilies - 2kg', farmer: 'Suresh Agro', status: 'Processing', amount: '₹120' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'In Transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fetch products from farmers
  const fetchProducts = async () => {
    setLoadingProducts(true);
    const token = localStorage.getItem('jwtToken');

    if (!token) {
      setMessage({ text: 'Please log in to browse products.', type: 'error' });
      setLoadingProducts(false);
      return;
    }

    try {
      const url = new URL(`${backendUrl}/api/products/browse`);
      if (searchTerm) url.searchParams.append('search', searchTerm);
      if (categoryFilter !== 'all') url.searchParams.append('category', categoryFilter);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (response.ok) {
        setProducts(data.products || []);
        setMessage({ text: '', type: '' });
      } else {
        setMessage({ text: data.msg || 'Failed to fetch products.', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage({ text: 'Network error. Could not fetch products.', type: 'error' });
    } finally {
      setLoadingProducts(false);
    }
  };

  // Post a requirement
  const postRequirement = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');

    if (!token) {
      setMessage({ text: 'Please log in to post requirements.', type: 'error' });
      return;
    }

    if (!requirementForm.productName || !requirementForm.quantity || !requirementForm.unit) {
      setMessage({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/requirements/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requirementForm)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: 'Requirement posted successfully!', type: 'success' });
        setRequirementForm({
          productName: '',
          quantity: '',
          unit: 'kg',
          maxPrice: '',
          description: '',
          category: '',
          urgency: 'medium',
          deadline: ''
        });
        setShowRequirementForm(false);
        fetchMyRequirements();
      } else {
        setMessage({ text: data.msg || 'Failed to post requirement.', type: 'error' });
      }
    } catch (error) {
      console.error('Error posting requirement:', error);
      setMessage({ text: 'Network error. Could not post requirement.', type: 'error' });
    }
  };

  // Fetch vendor's requirements
  const fetchMyRequirements = async () => {
    setLoadingRequirements(true);
    const token = localStorage.getItem('jwtToken');

    if (!token) {
      setLoadingRequirements(false);
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/requirements/my-requirements`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (response.ok) {
        setRequirements(data.requirements || []);
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
    } finally {
      setLoadingRequirements(false);
    }
  };

  // Handle contact farmer
  const handleContactFarmer = (product) => {
    setSelectedProduct(product);
    setShowContactModal(true);
  };

  // Handle order product
  const handleOrderProduct = (product) => {
    setSelectedProduct(product);
    setOrderForm({
      quantity: '',
      notes: '',
      urgency: 'medium'
    });
    setShowOrderModal(true);
  };

  // Submit order
  const submitOrder = async (e) => {
    e.preventDefault();
    
    if (!orderForm.quantity || parseFloat(orderForm.quantity) <= 0) {
      setMessage({ text: 'Please enter a valid quantity.', type: 'error' });
      return;
    }

    if (parseFloat(orderForm.quantity) > selectedProduct.stock) {
      setMessage({ text: 'Quantity exceeds available stock.', type: 'error' });
      return;
    }

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      setMessage({ text: 'Please log in to place orders.', type: 'error' });
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/orders/place`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: selectedProduct._id,
          quantity: parseFloat(orderForm.quantity),
          notes: orderForm.notes.trim(),
          urgency: orderForm.urgency
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          text: `Order placed successfully! Order total: ₹${(parseFloat(orderForm.quantity) * selectedProduct.price).toFixed(2)}`, 
          type: 'success' 
        });
        
        setShowOrderModal(false);
        setOrderForm({ quantity: '', notes: '', urgency: 'medium' });
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setMessage({ text: '', type: '' });
        }, 5000);
      } else {
        setMessage({ text: data.msg || 'Failed to place order.', type: 'error' });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setMessage({ text: 'Network error. Could not place order.', type: 'error' });
    }
  };

  useEffect(() => {
    fetchMyRequirements();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 w-10 h-10 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">VendHub Vendor</h1>
              <p className="text-sm text-gray-600">Source quality products from farmers</p>
            </div>
            <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              Welcome, {user?.name || 'Vendor'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Message Display */}
      {message.text && (
        <div className={`mx-6 mt-4 p-4 rounded-lg text-center flex items-center justify-center ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <Package className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-gray-800">{recentOrders.length}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Products</p>
                <p className="text-2xl font-bold text-gray-800">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">My Requirements</p>
                <p className="text-2xl font-bold text-gray-800">{requirements.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Products from Farmers */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Available Products</h3>
              <button 
                onClick={() => {
                  setShowProductBrowser(true);
                  fetchProducts();
                }}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700"
              >
                Browse All
              </button>
            </div>
            <div className="space-y-3">
              {products.slice(0, 3).map((product, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-green-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.owner?.farmName || product.owner?.name}</p>
                      <p className="text-sm text-gray-500">Stock: {product.stock} {product.unit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">₹{product.price}/{product.unit}</p>
                    <button 
                      onClick={() => handleContactFarmer(product)}
                      className="text-sm text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded mt-1"
                    >
                      Contact
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No products available</p>
                  <button 
                    onClick={fetchProducts}
                    className="text-blue-600 hover:text-blue-700 mt-2"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {recentOrders.map((order, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{order.item}</p>
                      <p className="text-sm text-gray-600">{order.farmer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{order.amount}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-center text-blue-600 hover:text-blue-700 font-medium">
              View All Orders
            </button>
          </div>
        </div>

        {/* Requirements Section */}
        <div className="mt-6 bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Post Your Requirements</h3>
            <button 
              onClick={() => setShowRequirementForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Post New Requirement
            </button>
          </div>
          
          {/* Quick requirement form */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Product needed (e.g., Onions)"
              value={requirementForm.productName}
              onChange={(e) => setRequirementForm({...requirementForm, productName: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <input
              type="text"
              placeholder="Quantity (e.g., 50)"
              value={requirementForm.quantity}
              onChange={(e) => setRequirementForm({...requirementForm, quantity: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <select
              value={requirementForm.unit}
              onChange={(e) => setRequirementForm({...requirementForm, unit: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="kg">Kilogram (kg)</option>
              <option value="gram">Gram (g)</option>
              <option value="liter">Liter (L)</option>
              <option value="piece">Piece</option>
              <option value="dozen">Dozen</option>
              <option value="bundle">Bundle</option>
            </select>
            <button 
              onClick={postRequirement}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Quick Post
            </button>
          </div>

          {/* My Requirements */}
          {requirements.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3">My Recent Requirements</h4>
              <div className="space-y-2">
                {requirements.slice(0, 3).map((req, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{req.productName} - {req.quantity} {req.unit}</p>
                      <p className="text-sm text-gray-600">{req.responses?.length || 0} responses</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getUrgencyColor(req.urgency)}`}>
                        {req.urgency}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        req.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => {
                setShowProductBrowser(true);
                fetchProducts();
              }}
              className="p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex flex-col items-center space-y-2"
            >
              <Package className="w-6 h-6" />
              <span className="text-sm font-medium">Browse Products</span>
            </button>
            <button className="p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex flex-col items-center space-y-2">
              <ShoppingCart className="w-6 h-6" />
              <span className="text-sm font-medium">Track Orders</span>
            </button>
            <button className="p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors flex flex-col items-center space-y-2">
              <Mail className="w-6 h-6" />
              <span className="text-sm font-medium">Message Farmers</span>
            </button>
            <button 
              onClick={() => setShowRequirementForm(true)}
              className="p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors flex flex-col items-center space-y-2"
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-sm font-medium">Post Requirement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Browser Modal */}
      {showProductBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Browse Products</h2>
                <button 
                  onClick={() => setShowProductBrowser(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              {/* Search and Filter */}
              <div className="mt-4 flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                  <option value="grains">Grains</option>
                  <option value="organic">Organic</option>
                </select>
                <button 
                  onClick={fetchProducts}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingProducts ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div key={product._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                      )}
                      <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold text-green-600">₹{product.price}/{product.unit}</span>
                        <span className="text-sm text-gray-500">Stock: {product.stock} {product.unit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{product.owner?.farmName || product.owner?.name}</p>
                          <p className="text-xs text-gray-500">{product.owner?.farmLocation}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleContactFarmer(product)}
                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                          >
                            Contact
                          </button>
                          <button 
                            onClick={() => handleOrderProduct(product)}
                            className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100"
                          >
                            Order
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Requirement Form Modal */}
      {showRequirementForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Post New Requirement</h2>
                <button 
                  onClick={() => setShowRequirementForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <form onSubmit={postRequirement} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={requirementForm.productName}
                    onChange={(e) => setRequirementForm({...requirementForm, productName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Fresh Onions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={requirementForm.category}
                    onChange={(e) => setRequirementForm({...requirementForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Vegetables"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="text"
                    required
                    value={requirementForm.quantity}
                    onChange={(e) => setRequirementForm({...requirementForm, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., 50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                  <select
                    required
                    value={requirementForm.unit}
                    onChange={(e) => setRequirementForm({...requirementForm, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="gram">Gram (g)</option>
                    <option value="liter">Liter (L)</option>
                    <option value="piece">Piece</option>
                    <option value="dozen">Dozen</option>
                    <option value="bundle">Bundle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (₹)</label>
                  <input
                    type="number"
                    value={requirementForm.maxPrice}
                    onChange={(e) => setRequirementForm({...requirementForm, maxPrice: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                  <select
                    value={requirementForm.urgency}
                    onChange={(e) => setRequirementForm({...requirementForm, urgency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                  <input
                    type="date"
                    value={requirementForm.deadline}
                    onChange={(e) => setRequirementForm({...requirementForm, deadline: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows="3"
                  value={requirementForm.description}
                  onChange={(e) => setRequirementForm({...requirementForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Any specific requirements or details..."
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Post Requirement
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequirementForm(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Farmer Modal */}
      {showContactModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Contact Farmer</h2>
                <button 
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-4">
                {selectedProduct.imageUrl && (
                  <img 
                    src={selectedProduct.imageUrl} 
                    alt={selectedProduct.name} 
                    className="w-20 h-20 object-cover rounded-lg mx-auto mb-3"
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-800">{selectedProduct.name}</h3>
                <p className="text-green-600 font-medium">₹{selectedProduct.price}/{selectedProduct.unit}</p>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-700">Farmer Details:</p>
                  <p className="text-gray-600">
                    <strong>Name:</strong> {selectedProduct.owner?.name}
                  </p>
                  {selectedProduct.owner?.farmName && (
                    <p className="text-gray-600">
                      <strong>Farm:</strong> {selectedProduct.owner.farmName}
                    </p>
                  )}
                  {selectedProduct.owner?.farmLocation && (
                    <p className="text-gray-600">
                      <strong>Location:</strong> {selectedProduct.owner.farmLocation}
                    </p>
                  )}
                  {selectedProduct.owner?.email && (
                    <p className="text-gray-600">
                      <strong>Email:</strong> {selectedProduct.owner.email}
                    </p>
                  )}
                  {selectedProduct.owner?.phone && (
                    <p className="text-gray-600">
                      <strong>Phone:</strong> {selectedProduct.owner.phone}
                    </p>
                  )}
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-700">Product Details:</p>
                  <p className="text-gray-600">
                    <strong>Available Stock:</strong> {selectedProduct.stock} {selectedProduct.unit}
                  </p>
                  {selectedProduct.category && (
                    <p className="text-gray-600">
                      <strong>Category:</strong> {selectedProduct.category}
                    </p>
                  )}
                  {selectedProduct.description && (
                    <p className="text-gray-600">
                      <strong>Description:</strong> {selectedProduct.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    handleOrderProduct(selectedProduct);
                  }}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Place Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Product Modal */}
      {showOrderModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Place Order</h2>
                <button 
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <form onSubmit={submitOrder} className="p-6">
              <div className="text-center mb-4">
                {selectedProduct.imageUrl && (
                  <img 
                    src={selectedProduct.imageUrl} 
                    alt={selectedProduct.name} 
                    className="w-16 h-16 object-cover rounded-lg mx-auto mb-2"
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-800">{selectedProduct.name}</h3>
                <p className="text-green-600 font-medium">₹{selectedProduct.price}/{selectedProduct.unit}</p>
                <p className="text-sm text-gray-500">Available: {selectedProduct.stock} {selectedProduct.unit}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity ({selectedProduct.unit}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    max={selectedProduct.stock}
                    required
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({...orderForm, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder={`Enter quantity (max: ${selectedProduct.stock})`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <select
                    value={orderForm.urgency}
                    onChange={(e) => setOrderForm({...orderForm, urgency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="low">Low - Flexible delivery</option>
                    <option value="medium">Medium - Standard delivery</option>
                    <option value="high">High - Urgent delivery</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows="3"
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Any special requirements or notes..."
                  ></textarea>
                </div>
                
                {orderForm.quantity && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Total Cost:</strong> ₹{(parseFloat(orderForm.quantity || 0) * selectedProduct.price).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;