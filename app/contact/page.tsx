import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, Clock, Send, MessageSquare } from "lucide-react"

export const metadata: Metadata = {
  title: "Contact Us - AnalyzeX",
  description: "Get in touch with the AnalyzeX team. We're here to help with your data analysis needs.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Get in Touch</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Have questions about AnalyzeX? Need help with your data analysis? We're here to help and would love to hear
            from you.
          </p>
        </div>
      </section>

      {/* Contact Form and Info */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="bg-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                  Send us a Message
                </CardTitle>
                <p className="text-gray-600">Fill out the form below and we'll get back to you as soon as possible.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="john.doe@example.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input id="company" placeholder="Your Company Name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="How can we help you?" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Tell us more about your inquiry..." className="min-h-[120px]" />
                </div>

                <Button className="w-full" size="lg">
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>

                <p className="text-sm text-gray-500 text-center">
                  We typically respond within 24 hours during business days.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Contact Information</CardTitle>
                  <p className="text-gray-600">Reach out to us directly using the information below.</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-blue-100 p-3 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Email</h3>
                      <p className="text-gray-600">For general inquiries and support</p>
                      <a
                        href="mailto:serversyncindia@gmail.com"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        serversyncindia@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-green-100 p-3 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Phone</h3>
                      <p className="text-gray-600">Call us during business hours</p>
                      <a href="tel:+919445699217" className="text-green-600 hover:text-green-800 font-medium">
                        +91 94456 99217
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-purple-100 p-3 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Business Hours</h3>
                      <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM IST</p>
                      <p className="text-gray-600">Saturday: 10:00 AM - 2:00 PM IST</p>
                      <p className="text-gray-600">Sunday: Closed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-xl">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Need Immediate Help?</h3>
                  <p className="mb-6 text-blue-100">
                    For urgent technical support or sales inquiries, don't hesitate to call us directly.
                  </p>
                  <div className="space-y-3">
                    <Button variant="secondary" className="w-full justify-start">
                      <Phone className="mr-2 h-4 w-4" />
                      Call Now: +91 94456 99217
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-white border-white hover:bg-white hover:text-blue-600 bg-transparent"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Email: serversyncindia@gmail.com
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-xl">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Other Ways to Connect</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Documentation & Support</h4>
                      <p className="text-gray-600 text-sm">
                        Check our comprehensive documentation for quick answers to common questions.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Feature Requests</h4>
                      <p className="text-gray-600 text-sm">
                        Have an idea for a new feature? We'd love to hear about it!
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Partnership Inquiries</h4>
                      <p className="text-gray-600 text-sm">
                        Interested in partnering with AnalyzeX? Let's discuss opportunities.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Quick answers to common questions about AnalyzeX.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">How secure is my data?</h3>
                <p className="text-gray-600 text-sm">
                  Your data never leaves your environment. AnalyzeX only processes mathematical relations and sends
                  computed results, ensuring complete privacy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">What file formats do you support?</h3>
                <p className="text-gray-600 text-sm">
                  We support CSV, Excel (XLSX, XLS), JSON, and various database connections for seamless data import.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">Do you offer custom integrations?</h3>
                <p className="text-gray-600 text-sm">
                  Yes! We can work with your team to create custom integrations and tailored solutions for your specific
                  needs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">What's your response time?</h3>
                <p className="text-gray-600 text-sm">
                  We typically respond to inquiries within 24 hours during business days, often much sooner for urgent
                  matters.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
