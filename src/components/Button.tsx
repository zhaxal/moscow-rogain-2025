import { mossport } from "@/utils/fonts";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "orange";
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  disabled = false,
  onClick,
  type = "button",
  className = "",
}) => {
  const baseClasses = `
    uppercase font-normal rounded-full px-[60px] sm:px-[40px] xs:px-[20px] h-[60px] text-[26px] text-white 
    disabled:opacity-50 disabled:cursor-not-allowed 
    hover:shadow-lg transition-shadow duration-200
    min-w-fit whitespace-nowrap
    ${mossport.className}
  `;

  const variantClasses = {
    primary: "bg-[#6DAD3A]",
    orange: "bg-[#ed972c]",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
