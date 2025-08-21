import { useState } from 'react'
import { Routes, Route } from "react-router-dom"
import { Home } from './pages'
import { Layout } from './components'


function App() {

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Layout>
    </>
  )
}

export default App
