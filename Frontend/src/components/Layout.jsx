import { Link } from "react-router-dom"
import { Vote, Plus, Home } from "lucide-react"

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen max-w-screen bg-background overflow-hidden">
      <header className="border-b w-full border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between pr-5">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
              <Vote className="h-6 w-6" />
              QuickPoll
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link
                to="/create"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                Create Poll
              </Link>
            </div>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

export default Layout
