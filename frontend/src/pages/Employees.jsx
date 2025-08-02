const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  // Data fetching functions
  const fetchEmployees = async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        search: searchTerm,
        role: selectedRole,
        department: selectedDepartment,
        ...filters
      });
      
      const data = await apiCall(`/employees?${params}`);
      setEmployees(data.data.employees || []);
      setStats(data.data.stats || {});
      setTotalPages(data.meta?.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      alert('Failed to fetch employees: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const data = await apiCall('/employees/attendance/today');
      setTodayAttendance(data.data.attendanceSummary || []);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const data = await apiCall('/employees/stats/attendance');
      setAttendanceStats(data.data);
    } catch (error) {
      console.error('Failed to fetch attendance stats:', error);
    }
  };

  useEffect(() => {
    fetchEmployees(currentPage);
    fetchTodayAttendance();
    fetchAttendanceStats();
  }, [currentPage, searchTerm, selectedRole, selectedDepartment]);

  // Employee operations
  const handleAddEmployee = async () => {
    try {
      const payload = { ...formData };
      
      // Convert string values to numbers where needed
      if (payload.salary.base) payload.salary.base = parseFloat(payload.salary.base);
      if (payload.salary.overtime) payload.salary.overtime = parseFloat(payload.salary.overtime);
      if (payload.salary.bonus) payload.salary.bonus = parseFloat(payload.salary.bonus);
      if (payload.salary.deductions) payload.salary.deductions = parseFloat(payload.salary.deductions);
      if (payload.hourlyRate) payload.hourlyRate = parseFloat(payload.hourlyRate);

      const response = await apiCall('/employees', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      await fetchEmployees(currentPage);
      setShowAddModal(false);
      resetForm();
      alert('Employee added successfully!');
    } catch (error) {
      alert('Failed to add employee: ' + error.message);
    }
  };

  const handleUpdateEmployee = async () => {
    try {
      const payload = { ...formData };
      
      // Convert string values to numbers
      if (payload.salary.base) payload.salary.base = parseFloat(payload.salary.base);
      if (payload.salary.overtime) payload.salary.overtime = parseFloat(payload.salary.overtime);
      if (payload.salary.bonus) payload.salary.bonus = parseFloat(payload.salary.bonus);
      if (payload.salary.deductions) payload.salary.deductions = parseFloat(payload.salary.deductions);
      if (payload.hourlyRate) payload.hourlyRate = parseFloat(payload.hourlyRate);

      await apiCall(`/employees/${editingEmployee._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      await fetchEmployees(currentPage);
      setEditingEmployee(null);
      resetForm();
      alert('Employee updated successfully!');
    } catch (error) {
      alert('Failed to update employee: ' + error.message);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) return;
    
    try {
      await apiCall(`/employees/${employeeId}`, { 
        method: 'DELETE',
        body: JSON.stringify({ reason: 'Administrative deactivation' })
      });
      
      await fetchEmployees(currentPage);
      alert('Employee deactivated successfully!');
    } catch (error) {
      alert('Failed to deactivate employee: ' + error.message);
    }
  };

  // Attendance operations
  const handleCheckIn = async (employeeId) => {
    try {
      await apiCall(`/employees/${employeeId}/checkin`, { 
        method: 'POST',
        body: JSON.stringify({
          workLocation: 'dining',
          latitude: 0,
          longitude: 0,
          address: 'Restaurant Location'
        })
      });
      
      await fetchTodayAttendance();
      alert('Check-in successful!');
    } catch (error) {
      alert('Check-in failed: ' + error.message);
    }
  };

  const handleCheckOut = async (employeeId) => {
    try {
      await apiCall(`/employees/${employeeId}/checkout`, { 
        method: 'POST',
        body: JSON.stringify({
          latitude: 0,
          longitude: 0,
          address: 'Restaurant Location'
        })
      });
      
      await fetchTodayAttendance();
      alert('Check-out successful!');
    } catch (error) {
      alert('Check-out failed: ' + error.message);
    }
  };

  const handleStartBreak = async (employeeId, type = 'other') => {
    try {
      await apiCall(`/employees/${employeeId}/break/start`, {
        method: 'POST',
        body: JSON.stringify({ type })
      });
      
      await fetchTodayAttendance();
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} break started!`);
    } catch (error) {
      alert('Failed to start break: ' + error.message);
    }
  };

  const handleEndBreak = async (employeeId) => {
    try {
      await apiCall(`/employees/${employeeId}/break/end`, {
        method: 'POST'
      });
      
      await fetchTodayAttendance();
      alert('Break ended!');
    } catch (error) {
      alert('Failed to end break: ' + error.message);
    }
  };

  // View details
  const viewEmployeeDetails = async (employee) => {
    try {
      const data = await apiCall(`/employees/${employee._id}`);
      setSelectedEmployee(data.data);
      setShowDetailsModal(true);
    } catch (error) {
      alert('Failed to fetch employee details: ' + error.message);
    }
  };

  const viewSalaryDetails = async (employee) => {
    try {
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      const data = await apiCall(`/employees/${employee._id}/salary/${month}/${year}`);
      setSalaryData(data.data);
      setSelectedEmployee(employee);
      setShowSalaryModal(true);
    } catch (error) {
      alert('Failed to fetch salary details: ' + error.message);
    }
  };

  const viewPayslip = async (employee) => {
    try {
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      const data = await apiCall(`/employees/${employee._id}/payslip/${month}/${year}`);
      setPayslipData(data.data);
      setSelectedEmployee(employee);
      setShowPayslipModal(true);
    } catch (error) {
      alert('Failed to fetch payslip: ' + error.message);
    }
  };

  // Form helpers
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      alternatePhone: '',
      role: 'waiter',
      department: 'service',
      salary: { base: '', overtime: '', bonus: '', deductions: '' },
      payrollType: 'monthly',
      hourlyRate: '',
      address: { street: '', city: '', state: '', pincode: '', country: 'India' },
      emergencyContact: { name: '', phone: '', relationship: '', address: '' },
      shiftTiming: { type: 'fixed', startTime: '09:00', endTime: '18:00', breakDuration: 60, weeklyOffs: [] },
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      skills: [],
      qualification: '',
      bankDetails: { accountNumber: '', ifscCode: '', bankName: '', branchName: '', accountHolderName: '' }
    });
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      alternatePhone: employee.alternatePhone || '',
      role: employee.role || 'waiter',
      department: employee.department || 'service',
      salary: {
        base: employee.salary?.base?.toString() || '',
        overtime: employee.salary?.overtime?.toString() || '',
        bonus: employee.salary?.bonus?.toString() || '',
        deductions: employee.salary?.deductions?.toString() || ''
      },
      payrollType: employee.payrollType || 'monthly',
      hourlyRate: employee.hourlyRate?.toString() || '',
      address: employee.address || { street: '', city: '', state: '', pincode: '', country: 'India' },
      emergencyContact: employee.emergencyContact || { name: '', phone: '', relationship: '', address: '' },
      shiftTiming: employee.shiftTiming || { type: 'fixed', startTime: '09:00', endTime: '18:00', breakDuration: 60, weeklyOffs: [] },
      dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
      gender: employee.gender || '',
      bloodGroup: employee.bloodGroup || '',
      skills: employee.skills || [],
      qualification: employee.qualification || '',
      bankDetails: employee.bankDetails || { accountNumber: '', ifscCode: '', bankName: '', branchName: '', accountHolderName: '' }
    });
  };

  // Constants
  const roles = ['waiter', 'cook', 'chef', 'cashier', 'cleaner', 'manager', 'supervisor', 'host', 'bartender', 'delivery-boy', 'security'];
  const departments = ['kitchen', 'service', 'management', 'maintenance', 'security', 'delivery'];
  
  const roleColors = {
    waiter: 'bg-blue-100 text-blue-800',
    cook: 'bg-orange-100 text-orange-800',
    chef: 'bg-red-100 text-red-800',
    cashier: 'bg-green-100 text-green-800',
    cleaner: 'bg-purple-100 text-purple-800',
    manager: 'bg-indigo-100 text-indigo-800',
    supervisor: 'bg-yellow-100 text-yellow-800',
    host: 'bg-pink-100 text-pink-800',
    bartender: 'bg-teal-100 text-teal-800',
    'delivery-boy': 'bg-cyan-100 text-cyan-800',
    security: 'bg-gray-100 text-gray-800'
  };

  // Dashboard Component
  const Dashboard = () => {
    const presentToday = todayAttendance.filter(att => att.isPresent).length;
    const absentToday = todayAttendance.filter(att => !att.isPresent).length;
    const onBreakToday = todayAttendance.filter(att => att.onBreak).length;
    const totalEmployees = employees.length;
    const attendancePercentage = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

    return (
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-800">{totalEmployees}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{presentToday}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{absentToday}</p>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On Break</p>
                <p className="text-2xl font-bold text-yellow-600">{onBreakToday}</p>
              </div>
              <Coffee className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance</p>
                <p className="text-2xl font-bold text-purple-600">{attendancePercentage}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Today's Attendance</h2>
            <button
              onClick={fetchTodayAttendance}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayAttendance.slice(0, 9).map(emp => (
                <div key={emp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{emp.name}</p>
                      <p className="text-sm text-gray-600">{emp.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {emp.isPresent ? (
                      emp.onBreak ? (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          On Break
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Present
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Absent
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {todayAttendance.length > 9 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All ({todayAttendance.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Department Stats */}
        {attendanceStats && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Department Overview</h2>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(attendanceStats.departmentSummary || {}).map(([dept, data]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 capitalize">{dept}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {data.present}/{data.total}
                    </span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${data.total > 0 ? (data.present / data.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Employee Card Component
  const EmployeeCard = ({ employee }) => {
    const attendance = todayAttendance.find(att => att.id === employee._id);
    const isOnBreak = attendance?.onBreak || false;
    
    return (
      <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{employee.name}</h3>
                <p className="text-sm text-gray-600">{employee.employeeId}</p>
              </div>
            </div>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${roleColors[employee.role] || 'bg-gray-100 text-gray-800'}`}>
              {employee.role}
            </span>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              <span className="truncate">{employee.email}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2" />
              <span>{employee.phone}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="w-4 h-4 mr-2" />
              <span>₹{employee.salary?.base?.toLocaleString()}/month</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="capitalize">{employee.department}</span>
            </div>
          </div>

          {/* Attendance Status */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              {attendance?.isPresent ? (
                isOnBreak ? (
                  <Coffee className="w-5 h-5 text-yellow-600" />
                ) : (
                  <UserCheck className="w-5 h-5 text-green-600" />
                )
              ) : (
                <UserX className="w-5 h-5 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {attendance?.isPresent 
                  ? (isOnBreak ? 'On Break' : 'Present') 
                  : 'Absent'
                }
              </span>
            </div>
            {attendance?.loginTime && (
              <span className="text-xs text-gray-600">
                In: {new Date(attendance.loginTime).toLocaleTimeString('en-US', { 
                  hour12: true, 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Attendance Actions */}
            <div className="flex space-x-2">
              {attendance?.isPresent ? (
                <>
                  {isOnBreak ? (
                    <button
                      onClick={() => handleEndBreak(employee._id)}
                      className="flex-1 bg-orange-100 text-orange-700 py-2 px-3 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
                    >
                      End Break
                    </button>
                  ) : (
                    <div className="flex space-x-1 flex-1">
                      <button
                        onClick={() => handleStartBreak(employee._id, 'lunch')}
                        className="flex-1 bg-yellow-100 text-yellow-700 py-2 px-2 rounded-lg hover:bg-yellow-200 transition-colors text-xs font-medium"
                        title="Lunch Break"
                      >
                        Lunch
                      </button>
                      <button
                        onClick={() => handleStartBreak(employee._id, 'tea')}
                        className="flex-1 bg-green-100 text-green-700 py-2 px-2 rounded-lg hover:bg-green-200 transition-colors text-xs font-medium"
                        title="Tea Break"
                      >
                        Tea
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleCheckOut(employee._id)}
                    disabled={attendance.logoutTime}
                    className="flex-1 bg-red-100 text-red-700 py-2 px-3 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {attendance.logoutTime ? 'Checked Out' : 'Check Out'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleCheckIn(employee._id)}
                  className="flex-1 bg-green-100 text-green-700 py-2 px-3 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                >
                  Check In
                </button>
              )}
            </div>

            {/* View Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => viewEmployeeDetails(employee)}
                className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>Details</span>
              </button>
              
              <button
                onClick={() => viewSalaryDetails(employee)}
                className="flex-1 bg-purple-100 text-purple-700 py-2 px-3 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
              >
                <DollarSign className="w-4 h-4" />
                <span>Salary</span>
              </button>

              <button
                onClick={() => viewPayslip(employee)}
                className="flex-1 bg-indigo-100 text-indigo-700 py-2 px-3 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
              >
                <FileText className="w-4 h-4" />
                <span>Payslip</span>
              </button>
            </div>

            {/* Management Actions */}
            <div className="flex space-x-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => handleEdit(employee)}
                className="flex-1 flex items-center justify-center py-2 px-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
              
              <button
                onClick={() => handleDeleteEmployee(employee._id)}
                className="flex-1 flex items-center justify-center py-2 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Employee Form Component
  const EmployeeForm = ({ isModal = false }) => (
    <div className={isModal ? 'space-y-4 max-h-96 overflow-y-auto' : 'space-y-6'}>
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter full name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter phone number"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone</label>
            <input
              type="tel"
              value={formData.alternatePhone}
              onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter alternate phone"
            />
          </div>
        </div>
      </div>

      {/* Job Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {roles.map(role => (
                <option key={role} value={role}>
                  {role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Save, X, Search, Clock, 
  User, Phone, Mail, MapPin, Calendar, DollarSign,
  UserCheck, UserX, Users, Award, AlertCircle, Eye,
  Filter, Download, FileText, TrendingUp, Coffee,
  CheckCircle, XCircle, PlayCircle, PauseCircle,
  BarChart3, PieChart, Activity, Settings, Bell,
  ArrowLeft, ArrowRight, RefreshCw, Home, LogOut
} from 'lucide-react';

const EmployeeManagementSystem = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [salaryData, setSalaryData] = useState(null);
  const [payslipData, setPayslipData] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    role: 'waiter',
    department: 'service',
    salary: { base: '', overtime: '', bonus: '', deductions: '' },
    payrollType: 'monthly',
    hourlyRate: '',
    address: { street: '', city: '', state: '', pincode: '', country: 'India' },
    emergencyContact: { name: '', phone: '', relationship: '', address: '' },
    shiftTiming: { type: 'fixed', startTime: '09:00', endTime: '18:00', breakDuration: 60, weeklyOffs: [] },
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    skills: [],
    qualification: '',
    bankDetails: { accountNumber: '', ifscCode: '', bankName: '', branchName: '', accountHolderName: '' }
  });

  const API_BASE_URL = 'https://billing-apis-brown.vercel.app/api';

  // API helper function
  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json