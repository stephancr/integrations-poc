"use client"

import Image from "next/image"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function MergeMagentoPage() {
  return (
    <div className="p-8 space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 flex-shrink-0">
              <Image src="/magento-logo.svg" alt="Magento logo" fill className="object-contain" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Magento</CardTitle>
              <CardDescription>Connect and sync data with Magento through Merge</CardDescription>
            </div>
            <div className="flex-shrink-0">
              <Button disabled variant="default">
                Connect via Merge
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
