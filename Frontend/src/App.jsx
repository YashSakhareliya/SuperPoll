import { useState } from 'react'
import { Routes, Route } from "react-router-dom"
import { Home, CreatePoll, PollView } from './pages'
import { Layout } from './components'


function App() {

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreatePoll />} />
          <Route path="/create" element={<PollView />} />
        </Routes>
      </Layout>
    </>
  )
}

export default App
