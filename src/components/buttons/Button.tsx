interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'neumorphic' | 'primary' | 'secondary'
  children: React.ReactNode
  className?: string
}

const Button = ({ 
  variant = 'neumorphic', 
  children, 
  className = '', 
  ...props 
}: ButtonProps) => {
  const baseClass = {
    'neumorphic': 'neumorphic-button',
    'primary': 'primary-button',
    'secondary': 'secondary-button'
  }[variant]

  return (
    <button 
      className={`${baseClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button 