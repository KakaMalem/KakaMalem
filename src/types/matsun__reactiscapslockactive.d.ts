declare module '@matsun/reactiscapslockactive' {
  import { ReactNode } from 'react'

  interface ReactIsCapsLockActiveProps {
    children: (active: boolean) => ReactNode
  }

  const ReactIsCapsLockActive: React.FC<ReactIsCapsLockActiveProps>

  export default ReactIsCapsLockActive
}
