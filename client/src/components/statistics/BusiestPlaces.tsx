import React from 'react';

interface Place {
  id: number;
  name: string;
}

interface BusiestPlacesProps {
  places: Place[];
}

const BusiestPlaces: React.FC<BusiestPlacesProps> = ({ places }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="bg-primary text-white py-3 px-4 rounded">
        <h3 className="font-bold text-center">BUSIEST PLACES TODAY</h3>
      </div>
      <div className="mt-4">
        <table className="w-full">
          <tbody>
            {places.map((place, index) => (
              <tr key={place.id} className={index < places.length - 1 ? "border-b" : ""}>
                <td className="py-3 px-4">{index + 1}. {place.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BusiestPlaces;
