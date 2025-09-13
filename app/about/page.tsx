import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  Brain,
  ChevronRight,
  Code2,
  Database,
  Github,
  Globe,
  LineChart,
  Mail,
  MessageSquare,
  PieChart,
  Shield,
} from "lucide-react"

export const metadata: Metadata = {
  title: "About AnalyzeX",
  description: "Learn about AnalyzeX - the advanced data analysis platform",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">About AnalyzeX</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Transforming complex data into actionable insights through advanced analytics and AI-powered intelligence
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-blue-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
                <p className="text-gray-600">
                  Leveraging cutting-edge machine learning to extract meaningful patterns from your data
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-blue-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <LineChart className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Advanced Visualization</h3>
                <p className="text-gray-600">Interactive charts and dashboards that bring your data to life</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-blue-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Data Privacy First</h3>
                <p className="text-gray-600">
                  Your data security is our priority with end-to-end encryption and secure processing
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                At AnalyzeX, we believe that data should be accessible and understandable to everyone, regardless of
                their technical expertise. Our mission is to democratize data analysis by providing powerful yet
                intuitive tools that transform raw data into actionable insights.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We're committed to pushing the boundaries of what's possible with data analysis, continuously innovating
                to bring the latest advancements in artificial intelligence and machine learning to our platform.
              </p>
              <p className="text-lg text-gray-600">
                Our goal is to empower organizations of all sizes to make data-driven decisions with confidence,
                unlocking the full potential of their information assets.
              </p>
            </div>
            <div className="relative h-96 rounded-xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-90"></div>
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="text-white text-center">
                  <h3 className="text-3xl font-bold mb-4">Data-Driven Excellence</h3>
                  <p className="text-xl">
                    Empowering better decisions through advanced analytics and AI-powered insights
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy-First Approach Section */}
      <section className="py-16 px-6 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Privacy-First Approach</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your data security and privacy are our top priorities. We've built AnalyzeX with a privacy-first
              architecture that ensures your sensitive information never leaves your control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-green-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Database className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Your Data Stays With You</h3>
                <p className="text-gray-600">
                  All datasets remain on your local environment or secure infrastructure. AnalyzeX never stores or
                  accesses your raw data files.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-blue-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Computed Results Only</h3>
                <p className="text-gray-600">
                  AnalyzeX only processes mathematical relations and statistical computations. Only calculated insights
                  and results are transmitted, never your original data.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-purple-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Secure Processing</h3>
                <p className="text-gray-600">
                  All analysis happens through encrypted connections with zero-knowledge architecture, ensuring complete
                  data confidentiality throughout the process.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="rounded-full bg-blue-500 text-white w-8 h-8 flex items-center justify-center mx-auto mb-3 text-sm font-semibold">
                  1
                </div>
                <h4 className="font-semibold mb-2">Upload Locally</h4>
                <p className="text-sm text-gray-600">
                  Your data files are processed entirely within your secure environment
                </p>
              </div>
              <div className="text-center">
                <div className="rounded-full bg-blue-500 text-white w-8 h-8 flex items-center justify-center mx-auto mb-3 text-sm font-semibold">
                  2
                </div>
                <h4 className="font-semibold mb-2">Compute Relations</h4>
                <p className="text-sm text-gray-600">
                  AnalyzeX calculates statistical relationships and mathematical insights
                </p>
              </div>
              <div className="text-center">
                <div className="rounded-full bg-blue-500 text-white w-8 h-8 flex items-center justify-center mx-auto mb-3 text-sm font-semibold">
                  3
                </div>
                <h4 className="font-semibold mb-2">Send Results Only</h4>
                <p className="text-sm text-gray-600">
                  Only computed insights and analysis results are transmitted securely
                </p>
              </div>
              <div className="text-center">
                <div className="rounded-full bg-blue-500 text-white w-8 h-8 flex items-center justify-center mx-auto mb-3 text-sm font-semibold">
                  4
                </div>
                <h4 className="font-semibold mb-2">Receive Insights</h4>
                <p className="text-sm text-gray-600">
                  Get actionable business insights while maintaining complete data privacy
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Platform Features</h2>
          <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Discover the powerful capabilities that make AnalyzeX the leading choice for data analysis
          </p>

          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="analysis">Data Analysis</TabsTrigger>
              <TabsTrigger value="ai">AI Insights</TabsTrigger>
              <TabsTrigger value="automl">AutoML</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="bg-white p-6 rounded-lg shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Comprehensive Data Analysis</h3>
                  <p className="text-gray-600 mb-6">
                    Our platform provides robust statistical analysis tools that help you understand your data from
                    every angle. From basic descriptive statistics to advanced correlation analysis, AnalyzeX gives you
                    the insights you need.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <span>Automated data profiling and quality assessment</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <span>Advanced statistical analysis with interpretable results</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <span>Correlation detection and relationship mapping</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <span>Outlier detection and anomaly analysis</span>
                    </li>
                  </ul>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative h-64 w-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-24 w-24 text-blue-500 opacity-50" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="bg-white p-6 rounded-lg shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">AI-Powered Insights</h3>
                  <p className="text-gray-600 mb-6">
                    Our advanced AI engine analyzes your data to uncover hidden patterns, predict future trends, and
                    provide actionable recommendations tailored to your specific needs.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <span>Natural language data querying and exploration</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <span>Automated insight generation and explanation</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <span>Predictive analytics and forecasting</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <span>Personalized recommendations based on data patterns</span>
                    </li>
                  </ul>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative h-64 w-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                      <Brain className="h-24 w-24 text-purple-500 opacity-50" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="automl" className="bg-white p-6 rounded-lg shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Automated Machine Learning</h3>
                  <p className="text-gray-600 mb-6">
                    Build powerful machine learning models without writing a single line of code. Our AutoML engine
                    handles everything from data preprocessing to model selection and hyperparameter tuning.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <span>One-click model training and evaluation</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <span>Automated feature engineering and selection</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <span>Model comparison and ensemble creation</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <span>Easy deployment and integration options</span>
                    </li>
                  </ul>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative h-64 w-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-teal-100 rounded-lg flex items-center justify-center">
                      <Code2 className="h-24 w-24 text-green-500 opacity-50" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="visualization" className="bg-white p-6 rounded-lg shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Interactive Visualizations</h3>
                  <p className="text-gray-600 mb-6">
                    Transform complex data into clear, compelling visualizations that tell the story behind your
                    numbers. Our interactive charts and dashboards make it easy to explore and share insights.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <span>Customizable charts and graphs</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <span>Interactive dashboards with drill-down capabilities</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <span>Real-time data visualization updates</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <span>Export and sharing options for reports</span>
                    </li>
                  </ul>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative h-64 w-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg flex items-center justify-center">
                      <PieChart className="h-24 w-24 text-orange-500 opacity-50" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Technology Stack</h2>
          <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Built with cutting-edge technologies for performance, scalability, and reliability
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "Python", description: "Core ML & Data Processing" },
              { name: "TensorFlow", description: "Deep Learning Framework" },
              { name: "React", description: "Modern Web Interface" },
              { name: "Node.js", description: "Backend Services" },
              { name: "PostgreSQL", description: "Data Storage" },
              { name: "Docker", description: "Containerization" },
              { name: "Kubernetes", description: "Orchestration" },
              { name: "AWS", description: "Cloud Infrastructure" },
            ].map((tech, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{tech.name}</h3>
                  <p className="text-gray-600 text-sm">{tech.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Get in Touch</h2>
          <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Have questions about AnalyzeX? We'd love to hear from you!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Mail className="h-10 w-10 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Email Us</h3>
                <p className="text-gray-600 mb-4">Our support team is always ready to help</p>
                <Button variant="outline">contact@analyzex.com</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <MessageSquare className="h-10 w-10 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
                <p className="text-gray-600 mb-4">Chat with our team during business hours</p>
                <Button>Start Chat</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Globe className="h-10 w-10 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Documentation</h3>
                <p className="text-gray-600 mb-4">Comprehensive guides and API docs</p>
                <div className="flex gap-4">
                  <Button variant="outline" size="icon">
                    <Github className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Database className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 text-center">
            <Link href="/app">
              <Button size="lg" className="px-8">
                Try AnalyzeX Now
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
