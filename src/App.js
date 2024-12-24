import React from 'react'
import { Routes, Route} from 'react-router-dom'
import LoginPage from './Components/LoginPage/LoginPage'
import './App.css'
import MyDocument from './Components/MyDocument/MyDocument'
import NotFound from './Components/NotFound'
import ProtectedRoute from './Components/Pages/ProtectedRoute'
import Home from './Components/Home/Home'
import PaymentTest from './Components/Pages/PaymentTest'
import LoginPayment from './Components/LoginPage/LoginPayment'

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/my-documents" element={
        <ProtectedRoute>
          <MyDocument/>
        </ProtectedRoute>
      } />
      <Route path="/payment" element={
        <ProtectedRoute>
          <PaymentTest/>
        </ProtectedRoute>
      } />
        <Route path="/loginPayment" element={
        <ProtectedRoute>
          <LoginPayment/>
        </ProtectedRoute>
      } />
   
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App
