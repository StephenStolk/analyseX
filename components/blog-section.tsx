"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, User, ArrowRight, BookOpen, TrendingUp, Code2, Database } from "lucide-react"
import Link from "next/link"
import { blogPosts } from "@/lib/blog-data"

const categoryIcons = {
  Python: Code2,
  SQL: Database,
  MLOps: TrendingUp,
  Statistics: BookOpen,
  Visualization: TrendingUp,
  "Big Data": Database,
}

const categoryColors = {
  Python: "bg-blue-100 text-blue-800 border-blue-200",
  SQL: "bg-green-100 text-green-800 border-green-200",
  MLOps: "bg-purple-100 text-purple-800 border-purple-200",
  Statistics: "bg-orange-100 text-orange-800 border-orange-200",
  Visualization: "bg-pink-100 text-pink-800 border-pink-200",
  "Big Data": "bg-indigo-100 text-indigo-800 border-indigo-200",
}

export function BlogSection() {
  const featuredPosts = blogPosts.filter((post) => post.featured)
  const regularPosts = blogPosts.filter((post) => !post.featured)

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Data Science Blog</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            In-depth tutorials, guides, and insights on data science, machine learning, and analytics. Learn from
            practical examples and real-world case studies.
          </p>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-16">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              Featured Articles
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post) => {
                const IconComponent = categoryIcons[post.category as keyof typeof categoryIcons] || BookOpen
                const categoryColor =
                  categoryColors[post.category as keyof typeof categoryColors] ||
                  "bg-gray-100 text-gray-800 border-gray-200"

                return (
                  <Card
                    key={post.id}
                    className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className={`${categoryColor} border`}>
                          <IconComponent className="h-3 w-3 mr-1" />
                          {post.category}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-500 gap-4">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {post.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readTime}
                          </span>
                        </div>
                      </div>
                      <CardTitle className="text-xl group-hover:text-blue-600 transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 line-clamp-3">{post.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {post.codePreview && (
                        <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
                          <pre className="text-sm text-gray-300">
                            <code>{post.codePreview}</code>
                          </pre>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {post.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{post.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                        <Link href={`/blog/${post.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="group-hover:bg-blue-50 group-hover:text-blue-600"
                          >
                            Read More
                            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Regular Posts */}
        {regularPosts.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-gray-600" />
              Latest Articles
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => {
                const IconComponent = categoryIcons[post.category as keyof typeof categoryIcons] || BookOpen
                const categoryColor =
                  categoryColors[post.category as keyof typeof categoryColors] ||
                  "bg-gray-100 text-gray-800 border-gray-200"

                return (
                  <Card
                    key={post.id}
                    className="group hover:shadow-lg transition-all duration-300 bg-white/60 backdrop-blur-sm"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={`${categoryColor} border text-xs`}>
                          <IconComponent className="h-3 w-3 mr-1" />
                          {post.category}
                        </Badge>
                        <span className="text-xs text-gray-500">{post.date}</span>
                      </div>
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500 gap-3">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {post.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readTime}
                          </span>
                        </div>
                        <Link href={`/blog/${post.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs group-hover:bg-blue-50 group-hover:text-blue-600"
                          >
                            Read
                            <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link href="/blog">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              View All Articles
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// Ensure BlogSection is exported as a named export

// Also export as default for compatibility
export default BlogSection
