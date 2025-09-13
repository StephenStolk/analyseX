import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Heart, Shield, Users, Zap, Globe, BarChart3, Briefcase } from "lucide-react"

export const metadata: Metadata = {
  title: "Careers - AnalyzeX",
  description: "Join the AnalyzeX team and help shape the future of data analysis",
}

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Join Our Mission</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Help us democratize data analysis and build the future of AI-powered insights. Join a team that's passionate
            about privacy, innovation, and making data accessible to everyone.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="px-8">
              View Open Positions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 bg-transparent">
              Learn About Our Culture
            </Button>
          </div>
        </div>
      </section>

      {/* Why Join AnalyzeX */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Join AnalyzeX?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're building something extraordinary, and we want passionate individuals to be part of our journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="rounded-full bg-blue-500 p-3 w-12 h-12 mb-4 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Innovation at Core</h3>
                <p className="text-gray-600">
                  Work with cutting-edge AI and machine learning technologies. Push the boundaries of what's possible in
                  data analysis.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="rounded-full bg-green-500 p-3 w-12 h-12 mb-4 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Privacy-First Mission</h3>
                <p className="text-gray-600">
                  Be part of a team that prioritizes user privacy and data security. Build solutions that users can
                  trust completely.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="rounded-full bg-purple-500 p-3 w-12 h-12 mb-4 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Collaborative Culture</h3>
                <p className="text-gray-600">
                  Join a diverse, inclusive team where every voice matters. Collaborate with brilliant minds from around
                  the world.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="rounded-full bg-orange-500 p-3 w-12 h-12 mb-4 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Global Impact</h3>
                <p className="text-gray-600">
                  Your work will impact organizations worldwide, helping them make better data-driven decisions.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
              <CardContent className="p-6">
                <div className="rounded-full bg-teal-500 p-3 w-12 h-12 mb-4 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Work-Life Balance</h3>
                <p className="text-gray-600">
                  Flexible working arrangements, comprehensive benefits, and a culture that values your well-being.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <CardContent className="p-6">
                <div className="rounded-full bg-indigo-500 p-3 w-12 h-12 mb-4 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Growth Opportunities</h3>
                <p className="text-gray-600">
                  Continuous learning, skill development, and career advancement in a rapidly growing company.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Culture & Values */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Culture & Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our values guide everything we do, from product development to how we treat each other.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="rounded-full bg-blue-100 p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Shield className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Privacy First</h3>
              <p className="text-gray-600">
                We believe privacy is a fundamental right. Every decision we make prioritizes user data security and
                confidentiality.
              </p>
            </div>

            <div className="text-center">
              <div className="rounded-full bg-purple-100 p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Zap className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Innovation</h3>
              <p className="text-gray-600">
                We embrace new technologies and approaches. We're not afraid to challenge the status quo and think
                differently.
              </p>
            </div>

            <div className="text-center">
              <div className="rounded-full bg-green-100 p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Users className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Accessibility</h3>
              <p className="text-gray-600">
                We make powerful data analysis tools accessible to everyone, regardless of technical background or
                expertise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Open Positions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our growing team and help shape the future of data analysis.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                title: "Senior Full-Stack Developer",
                department: "Engineering",
                location: "Remote / Hybrid",
                type: "Full-time",
                description:
                  "Build and maintain our core platform using React, Node.js, and Python. Experience with data visualization and ML pipelines preferred.",
              },
              {
                title: "Machine Learning Engineer",
                department: "AI/ML",
                location: "Remote / Hybrid",
                type: "Full-time",
                description:
                  "Develop and deploy ML models for automated data analysis. Strong background in Python, TensorFlow, and statistical analysis required.",
              },
              {
                title: "Product Designer",
                department: "Design",
                location: "Remote / Hybrid",
                type: "Full-time",
                description:
                  "Design intuitive user experiences for complex data analysis tools. Experience with data visualization and enterprise software preferred.",
              },
              {
                title: "DevOps Engineer",
                department: "Infrastructure",
                location: "Remote / Hybrid",
                type: "Full-time",
                description:
                  "Manage cloud infrastructure and deployment pipelines. Experience with AWS, Docker, and Kubernetes required.",
              },
              {
                title: "Data Scientist",
                department: "Analytics",
                location: "Remote / Hybrid",
                type: "Full-time",
                description:
                  "Research and develop new analytical methods and algorithms. PhD in Statistics, Mathematics, or related field preferred.",
              },
            ].map((job, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{job.title}</h3>
                        <Badge variant="secondary">{job.department}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {job.type}
                        </span>
                      </div>
                      <p className="text-gray-600">{job.description}</p>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-6">
                      <Button>
                        Apply Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Join Our Team?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Don't see a perfect match? We're always looking for talented individuals who share our passion for data and
            privacy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="px-8">
              Send Your CV
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 text-white border-white hover:bg-white hover:text-blue-600 bg-transparent"
            >
              Learn More About Us
            </Button>
          </div>
          <p className="text-blue-100 mt-6 text-sm">
            Email us at{" "}
            <a href="mailto:careers@analyzex.com" className="underline hover:text-white">
              careers@analyzex.com
            </a>{" "}
            with your resume and a note about why you'd like to join AnalyzeX.
          </p>
        </div>
      </section>
    </div>
  )
}
