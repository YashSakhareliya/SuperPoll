import { Link } from "react-router-dom"
import { Vote, Zap, Users, BarChart3, ArrowRight } from "lucide-react"

const Home = () => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
          <Zap className="h-4 w-4" />
          Real-time polling made simple
        </div>
        <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
          Create polls that
          <span className="text-primary"> engage</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          Build interactive polls in seconds, share with anyone, and watch results update in real-time. Perfect for
          events, classrooms, and team decisions.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg"
          >
            Create Your First Poll
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/poll/demo"
            className="inline-flex items-center gap-2 px-8 py-4 border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-semibold text-lg"
          >
            <Vote className="h-5 w-5" />
            Try Demo Poll
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 py-16">
        <div className="text-center p-6 rounded-xl bg-card border border-border">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-lg mb-4">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
          <p className="text-muted-foreground">
            Create polls in seconds with our quick-create format. Just type your question and options separated by |
          </p>
        </div>
        <div className="text-center p-6 rounded-xl bg-card border border-border">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary/10 text-secondary rounded-lg mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Anonymous Voting</h3>
          <p className="text-muted-foreground">
            No sign-ups required. Share your poll link and let anyone vote anonymously with built-in duplicate
            protection.
          </p>
        </div>
        <div className="text-center p-6 rounded-xl bg-card border border-border">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 text-accent rounded-lg mb-4">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Real-time Results</h3>
          <p className="text-muted-foreground">
            Watch votes come in live with animated charts and automatic insights when you reach 20+ votes.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center py-16 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Join thousands of users creating engaging polls every day.
        </p>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
        >
          Create Poll Now
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  )
}

export default Home
