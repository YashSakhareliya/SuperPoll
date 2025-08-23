import { useState } from 'react'
import { Routes, Route } from "react-router-dom"
import { Home, CreatePoll, PollView, Analytics, Insights } from './pages'
import { Layout } from './components'


function App() {

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreatePoll />} />
          <Route path="/poll/:id" element={<PollView />} />
          <Route path="/og/poll/:id" element={<PollView />} />
          <Route path="/poll/:id/analytics" element={<Analytics />} />
          <Route path="/poll/:id/insights" element={<Insights />} />
        </Routes>
      </Layout>
    </>
  )
}

export default App
