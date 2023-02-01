import { Dialog, DialogTitle } from "@mui/material";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
};

export default function SimpleDialog(props: Props) {
  const { onClose, open, children, title } = props;

  return (
    <Dialog onClose={onClose} open={open} fullWidth={true} maxWidth="xl">
      {title && <h2>{title}</h2>}
      {children}
    </Dialog>
  );
}
