"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"

export const Loader = () => {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="w-full flex h-16 items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile menu trigger skeleton */}
            <Skeleton className="h-10 w-10 rounded-md lg:hidden" />

            {/* Desktop sidebar toggle skeleton */}
            <Skeleton className="h-10 w-10 rounded-md hidden lg:flex" />

            <Separator orientation="vertical" className="mr-2 h-4" />

            {/* Mobile Logo skeleton */}
            <div className="flex items-center gap-2 lg:hidden">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-5 w-32 hidden sm:block" />
            </div>

            {/* Desktop Logo skeleton */}
            <div className="hidden lg:flex h-16 items-center">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            </div>
          </div>

          {/* Center search skeleton */}
          <div className="flex flex-1 items-center justify-end lg:justify-center px-2">
            <div className="relative hidden md:block w-full max-w-sm">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>

          {/* Right side actions skeleton */}
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar Skeleton - Hidden on mobile */}
        <aside className="hidden h-full border-r bg-background lg:flex lg:flex-shrink-0 w-64">
          <div className="flex flex-col w-full p-4 space-y-4">
            {/* Navigation items skeleton */}
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Bottom section skeleton */}
            <div className="mt-auto space-y-2">
              <div className="flex items-center gap-3 p-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 flex-1" />
              </div>
              <div className="flex items-center gap-3 p-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 flex-1" />
              </div>
            </div>
          </div>
        </aside>

        {/* Page Content Skeleton */}
        <main className="flex-1 min-w-0 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="w-full p-2 md:p-6 space-y-6">
              {/* Page header skeleton */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
                <Separator />
              </div>

              {/* Stats cards skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-5 rounded" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </Card>
                ))}
              </div>

              {/* Main content area skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Main chart/table */}
                <div className="lg:col-span-2 space-y-4">
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-9 w-24" />
                      </div>
                      <Separator />
                      {/* Chart area */}
                      <div className="space-y-3">
                        <Skeleton className="h-64 w-full rounded-lg" />
                      </div>
                    </div>
                  </Card>

                  {/* Table skeleton */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-40" />
                      <Separator />
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-6 w-16" />
                              <Skeleton className="h-8 w-8 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Right column - Sidebar content */}
                <div className="space-y-4">
                  {/* Recent activity */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-28" />
                      <Separator />
                      <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                            <div className="space-y-1 flex-1">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Quick stats */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-24" />
                      <Separator />
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-6 w-12" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Progress indicators */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-20" />
                      <Separator />
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex justify-between">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-8" />
                            </div>
                            <Skeleton className="h-2 w-full rounded-full" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Bottom section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <Separator />
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 rounded-lg" />
                          <div className="space-y-1 flex-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                          <Skeleton className="h-8 w-16" />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-28" />
                    <Separator />
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-6 w-12" />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer skeleton */}
      <footer className="hidden border-t bg-background/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex h-7 items-center justify-center px-4">
          <Skeleton className="h-3 w-64" />
        </div>
      </footer>
    </div>
  )
}
