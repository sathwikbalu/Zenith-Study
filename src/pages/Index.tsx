import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Sparkles, Users, Calendar, ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-display font-bold">Zenith Study</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Welcome to the Future of Learning</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">
            Study Smarter,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
              Together
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your learning experience with collaborative study sessions, smart organization tools, and a vibrant community of learners.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup">
              <Button size="lg" className="text-lg h-14 px-8 gap-2">
                Start Learning Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg h-14 px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-8 rounded-2xl bg-card border hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-display font-bold mb-3">Study Sessions</h3>
            <p className="text-muted-foreground">
              Create and join collaborative study sessions with AI-powered recommendations and real-time collaboration.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-card border hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-display font-bold mb-3">Study Groups</h3>
            <p className="text-muted-foreground">
              Connect with peers, share knowledge, and grow together in focused study groups for every subject.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-card border hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
              <Calendar className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-display font-bold mb-3">Smart Calendar</h3>
            <p className="text-muted-foreground">
              Never miss a deadline with intelligent scheduling and automatic reminders for all your study tasks.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary via-secondary to-accent p-12 rounded-3xl text-center text-white">
          <h2 className="text-4xl font-display font-bold mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Join thousands of students already using Zenith Study to achieve their academic goals.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="text-lg h-14 px-8 gap-2">
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Zenith Study. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
