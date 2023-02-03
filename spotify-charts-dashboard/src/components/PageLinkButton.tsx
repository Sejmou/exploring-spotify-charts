import { Button } from "@mui/material";
import Link from "next/link";

type Props = {
  path: string;
  text: string;
};

export default function PageLinkButton({ path, text }: Props) {
  return (
    <Link className="self-center" href={path}>
      <Button>{text}</Button>
    </Link>
  );
}
