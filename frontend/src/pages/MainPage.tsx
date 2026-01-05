import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../auth/AuthProvider';
import { LogOut } from 'lucide-react'; // Icons

interface Item {
  _id: string;
  name: string;
  availableStock: number;
}

const MainPage = () => {
  const { user, logout } = useAuth();

  const { data: items, refetch } = useQuery<Item[]>({
    queryKey: ['items'],
    queryFn: async () => (await api.get('/items')).data,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">StockTracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button onClick={logout} className="p-2 rounded-md hover:bg-gray-100">
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Daily Stock Entry ({new Date().toLocaleDateString()})</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Available</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Used</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items?.map((item) => (
                    <ItemRow key={item._id} item={item} refetchItems={refetch} />
                  ))}
                </tbody>
              </table>
              {(!items || items.length === 0) && <p className="text-gray-500 text-center py-4">No items available.</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const ItemRow = ({ item, refetchItems }: { item: Item; refetchItems: () => void }) => {
    const [quantity, setQuantity] = useState<number>(0);
    const mutation = useMutation({
        mutationFn: async () => {
             return api.post('/expenditure', { itemId: item._id, quantityUsed: quantity });
        },
        onSuccess: () => {
             alert(`Saved ${item.name}`);
             setQuantity(0);
             refetchItems(); // Refetch items to update available stock
        },
        onError: (error) => {
             alert(`Failed to save. ${error.message || 'Check stock.'}`);
        }
    });

    return (
        <tr>
            <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
            <td className="px-6 py-4 whitespace-nowrap">{item.availableStock}</td>
            <td className="px-6 py-4 whitespace-nowrap">
                <input 
                    type="number" 
                    min="0"
                    className="border rounded p-1 w-24"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <button 
                    onClick={() => {
                        if (quantity > 0) mutation.mutate();
                    }}
                    disabled={quantity <= 0 || mutation.isPending || quantity > item.availableStock}
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                    {mutation.isPending ? 'Saving...' : 'Add'}
                </button>
            </td>
        </tr>
    );
};

export default MainPage;
