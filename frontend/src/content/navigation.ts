/** Navigation per requirements §2. */
export const navItems = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Capabilities", href: "/capabilities" },
  { label: "Quality", href: "/quality" },
  { label: "Industries", href: "/industries" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
] as const;

export const cta = {
  primary: { label: "Request a Quote", href: "/request-a-quote" },
  secondary: { label: "Call Us", href: "tel:+918043848014" },
} as const;
