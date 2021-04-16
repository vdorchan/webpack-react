import React from 'react'

const Button: React.FC<{
  text: string
  onClick?: () => void
}> = ({ text, onClick }) => {
  return <button onClick={onClick}>{text}</button>
}

export default Button
