export function interpolateProps(props: Record<string, any>, stateData: Record<string, any>): Record<string, any> {
  const newProps = { ...props };
  
  Object.keys(newProps).forEach(key => {
    const val = newProps[key];
    
    if (typeof val === 'string' && val.includes('${')) {
      newProps[key] = val.replace(/\$\{([^}]+)\}/g, (_, path) => {
        // Handle nested paths like "user.name" if needed in future
        // For now, supporting simple top-level keys as per current implementation
        return stateData[path] !== undefined ? stateData[path] : '';
      });
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      // Recursively interpolate nested objects (like style)
      newProps[key] = interpolateProps(val, stateData);
    }
  });
  
  return newProps;
}
