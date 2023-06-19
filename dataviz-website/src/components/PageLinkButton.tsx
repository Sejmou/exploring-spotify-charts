import { Button } from "@mui/material";
import Link from "next/link";

type Props = {
  path: string;
  text: string;
  className?: string;
};

export default function PageLinkButton({ path, text, className }: Props) {
  return (
    <Link className={className} href={path}>
      <Button>{text}</Button>
    </Link>
  );
}
