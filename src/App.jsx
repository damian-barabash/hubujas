import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Admin from './pages/Admin'
import { defaultContent, loadPublished } from './lib/content'

export default function App() {
  const [content, setContent] = useState(defaultContent)

  useEffect(() => {
    let alive = true
    loadPublished().then((c) => { if (alive) setContent(c) })
    return () => { alive = false }
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Home content={content} />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Home content={content} />} />
    </Routes>
  )
}
