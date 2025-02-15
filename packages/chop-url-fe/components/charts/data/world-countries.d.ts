declare module './world-countries.json' {
  const value: {
    type: string;
    features: Array<{
      type: string;
      id: string;
      properties: {
        name: string;
      };
      geometry: {
        type: string;
        coordinates: number[][][];
      };
    }>;
  };
  export default value;
}
