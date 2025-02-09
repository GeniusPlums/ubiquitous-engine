import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu";

export function Navbar() {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent cursor-pointer">
            Astrazen
          </div>
        </Link>
        <NavigationMenu className="mx-6">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/builder">
                <Button variant="ghost">Journey Builder</Button>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/campaigns">
                <Button variant="ghost">Campaigns</Button>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/templates">
                <Button variant="ghost">Email Templates</Button>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/analytics">
                <Button variant="ghost">Analytics</Button>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}