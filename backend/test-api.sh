#!/bin/bash

# Felicity Event Management System - API Testing Script
# Run this script to test all authentication endpoints

echo "🧪 Felicity Event Management System - API Tests"
echo "================================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "❌ Server is not running!"
    echo "Please start the server first:"
    echo "  cd /home/keshav-goel/Desktop/Sem-4/DASS/felicity-event-system/backend"
    echo "  node server.js"
    echo ""
    exit 1
fi

echo "✅ Server is running on http://localhost:5000"
echo ""

# Test 1: Health Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s http://localhost:5000/api/health | json_pp
echo ""
echo ""

# Test 2: Admin Login
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Admin Login"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@felicity.com","password":"Admin@123"}' | json_pp
echo ""
echo ""

# Test 3: Participant Signup (IIIT)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Participant Signup (IIIT Email)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST http://localhost:5000/api/auth/participant/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test.user@students.iiit.ac.in",
    "password": "Test@123",
    "participantType": "IIIT",
    "collegeName": "IIIT Hyderabad",
    "contactNumber": "9876543210"
  }' | json_pp
echo ""
echo ""

# Test 4: Participant Signup (Non-IIIT)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Participant Signup (Non-IIIT Email)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST http://localhost:5000/api/auth/participant/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "External",
    "lastName": "User",
    "email": "external@gmail.com",
    "password": "Test@123",
    "participantType": "Non-IIIT",
    "collegeName": "Other College",
    "contactNumber": "9876543211"
  }' | json_pp
echo ""
echo ""

# Test 5: Participant Login
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Participant Login"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST http://localhost:5000/api/auth/participant/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test.user@students.iiit.ac.in","password":"Test@123"}' | json_pp
echo ""
echo ""

# Test 6: Invalid IIIT Email (Should Fail)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 6: Invalid IIIT Email (Should Fail)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST http://localhost:5000/api/auth/participant/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Invalid",
    "lastName": "User",
    "email": "invalid@gmail.com",
    "password": "Test@123",
    "participantType": "IIIT",
    "collegeName": "IIIT Hyderabad",
    "contactNumber": "9876543212"
  }' | json_pp
echo ""
echo ""

echo "✅ All tests completed!"
echo "Check MongoDB Atlas to see the created users"
