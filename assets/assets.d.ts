type Styles = Record<string, string>;

declare module '*.svg' {
  const content: string;
  export default content;
}
declare module '*.svg?rc' {
  const RC: React.FC<any>;
  export default RC;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.scss' {
  const content: Styles;
  export default content;
}

declare module '*.sass' {
  const content: Styles;
  export default content;
}

declare module '*.less' {
  const content: Styles;
  export default content;
}

declare module '*.css' {
  const content: Styles;
  export default content;
}

declare module '*.module.less' {
  const classes: {
    readonly [key: string]: string;
  };
  export default classes;
}
