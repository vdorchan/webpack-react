import React from 'react'
import styles from './Button.less'

const Button: React.FC<{
  text: string
  onClick?: () => void
}> = ({ text, onClick }) => {
  return (
    <button className={styles.button} onClick={onClick}>
      {text}
    </button>
  )
}

export default Button
