const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AreaUnitConverter />);

function AreaUnitConverter() {
  const [inputs, setInputs] = React.useState([{ value: '', fromUnit: 'squareMeter', toUnit: 'squareFoot' }]);
  const [sum, setSum] = React.useState(0);

  // Conversion factors to square meters (base unit)
  const conversionFactors = {
    squareMeter: 1,
    squareFoot: 0.09290304,
    squareInch: 0.00064516,
    squareYard: 0.83612736,
    acre: 4046.8564224,
    hectare: 10000,
    squareKilometer: 1000000,
    squareMile: 2589988.1103,
    squareCentimeter: 0.0001,
    squareMillimeter: 0.000001
  };

  // Names for display
  const unitNames = {
    squareMeter: 'Square Meter (m²)',
    squareFoot: 'Square Foot (ft²)',
    squareInch: 'Square Inch (in²)',
    squareYard: 'Square Yard (yd²)',
    acre: 'Acre',
    hectare: 'Hectare (ha)',
    squareKilometer: 'Square Kilometer (km²)',
    squareMile: 'Square Mile (mi²)',
    squareCentimeter: 'Square Centimeter (cm²)',
    squareMillimeter: 'Square Millimeter (mm²)'
  };

  const handleAddInput = () => {
    setInputs([...inputs, { value: '', fromUnit: 'squareMeter', toUnit: 'squareFoot' }]);
  };

  const handleRemoveInput = (index) => {
    const newInputs = [...inputs];
    newInputs.splice(index, 1);
    setInputs(newInputs);
    calculateSum(newInputs);
  };

  const handleInputChange = (index, field, value) => {
    const newInputs = [...inputs];
    newInputs[index][field] = value;
    setInputs(newInputs);
    calculateSum(newInputs);
  };

  const calculateSum = (currentInputs) => {
    let total = 0;
    currentInputs.forEach(input => {
      if (input.value && !isNaN(input.value)) {
        const valueInBaseUnit = parseFloat(input.value) * conversionFactors[input.fromUnit];
        const convertedValue = valueInBaseUnit / conversionFactors[input.toUnit];
        total += convertedValue;
      }
    });
    setSum(total);
  };

  const convertValue = (input) => {
    if (!input.value || isNaN(input.value)) return '';
    const valueInBaseUnit = parseFloat(input.value) * conversionFactors[input.fromUnit];
    const convertedValue = valueInBaseUnit / conversionFactors[input.toUnit];
    return convertedValue.toFixed(6);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">Area Unit Converter Calculator</h1>
      
      <div className="space-y-6">
        {inputs.map((input, index) => (
          <div key={index} className="p-4 border rounded-md bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center mb-4 gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Input Value</label>
                <input
                  type="number"
                  value={input.value}
                  onChange={(e) => handleInputChange(index, 'value', e.target.value)}
                  placeholder="Enter value"
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">From Unit</label>
                <select
                  value={input.fromUnit}
                  onChange={(e) => handleInputChange(index, 'fromUnit', e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  {Object.keys(unitNames).map(unit => (
                    <option key={unit} value={unit}>{unitNames[unit]}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">To Unit</label>
                <select
                  value={input.toUnit}
                  onChange={(e) => handleInputChange(index, 'toUnit', e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  {Object.keys(unitNames).map(unit => (
                    <option key={unit} value={unit}>{unitNames[unit]}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="bg-blue-50 p-2 rounded">
                <span className="font-medium">Result: </span>
                {input.value ? (
                  <span>{convertValue(input)} {unitNames[input.toUnit]}</span>
                ) : (
                  <span>-</span>
                )}
              </div>
              
              <button
                onClick={() => handleRemoveInput(index)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={inputs.length === 1}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex justify-between">
        <button
          onClick={handleAddInput}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Another Conversion
        </button>
        
        <div className="p-4 bg-green-100 rounded-md">
          <span className="font-bold">Total Sum: </span>
          <span className="text-lg">{sum.toFixed(6)}</span>
        </div>
      </div>
    </div>
  );
}