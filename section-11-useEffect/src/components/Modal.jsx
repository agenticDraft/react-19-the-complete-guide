import { useEffect } from "react";
import { forwardRef, useRef } from "react";
import { createPortal } from "react-dom";

const Modal = forwardRef(function Modal({ open, children }, ref) {
  const dialog = useRef();

  // Instead of useImperativeHandle we can also use useEffect

  // Ovde je bolje useImperativeHandle da se koristi
  useEffect(() => {
    open && dialog.current.showModal();
    !open && dialog.current.close();
  }, [open]);

  return createPortal(
    <dialog className="modal" ref={dialog}>
      {open ? children : null}
    </dialog>,
    document.getElementById("modal"),
  );
});

export default Modal;
