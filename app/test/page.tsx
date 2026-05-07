"use client";

/**
 * Visual smoke test for shadcn/ui + Askly violet theme.
 * Delete this route once Phase 2 starts touching real pages.
 */

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function TestPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-8">
      <header>
        <h1 className="text-3xl font-bold">Askly UI smoke test</h1>
        <p className="text-muted-foreground mt-2">
          If buttons are violet and toasts fire, the theme works.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primary (violet)</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Input + Label</h2>
        <div className="grid gap-2">
          <Label htmlFor="url">Website URL</Label>
          <Input id="url" type="url" placeholder="https://example.com" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Card</h2>
        <Card>
          <CardHeader>
            <CardTitle>Project: Stripe Docs Bot</CardTitle>
            <CardDescription>32 sources · last updated 2h ago</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              A card composes header, content, and footer. Border and bg follow the theme.
            </p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Open project</Button>
          </CardFooter>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Dialog</h2>
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>Open dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete project?</DialogTitle>
              <DialogDescription>
                This action is irreversible. All sources, chunks, and conversations will be removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="destructive">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Dropdown menu</h2>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>Account</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Toast</h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => toast.success("Project created")}>Success toast</Button>
          <Button variant="outline" onClick={() => toast.error("Crawl failed")}>
            Error toast
          </Button>
          <Button variant="outline" onClick={() => toast.info("12 pages crawled")}>
            Info toast
          </Button>
        </div>
      </section>
    </main>
  );
}
