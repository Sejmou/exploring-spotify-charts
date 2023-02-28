import { Dialog, DialogProps, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type Props = DialogProps & {
  title?: string;
};

const DialogWithCloseIcon = (props: Props) => {
  const { children, title, ...otherProps } = props;
  return (
    <Dialog {...otherProps}>
      <div className="flex flex-col">
        <div className="flex w-full justify-between">
          <div></div>
          <div className="self-center text-xl font-bold">{title}</div>
          <IconButton
            className="m-2"
            onClick={(e) => props.onClose?.(e, "backdropClick")}
          >
            <CloseIcon />
          </IconButton>
        </div>
        {children}
      </div>
    </Dialog>
  );
};
export default DialogWithCloseIcon;
