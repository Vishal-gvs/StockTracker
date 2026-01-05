import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import api from '../services/api';
import { useAuth } from '../auth/AuthProvider';
import { LogOut, Download, CheckCircle, PackagePlus } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface Expenditure {
  _id: string;
  date: string;
  itemId: { name: string; costPerUnit: number };
  quantityUsed: number;
  userId: { name: string };
  finalized: boolean;
}


// Modal Component
const ItemModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
    const { register, handleSubmit } = useForm<{ name: string; availableStock: number; costPerUnit: number }>();
    const mutation = useMutation({
        mutationFn: async (data: { name: string; availableStock: number; costPerUnit: number }) => {
            return api.post('/items', data);
        },
        onSuccess: () => {
            onSuccess();
            onClose();
        }
    });

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div className="bg-white p-5 rounded-lg shadow-xl w-96">
                <h3 className="text-lg font-bold mb-4">Add New Item</h3>
                <form onSubmit={handleSubmit((data) => mutation.mutate({ ...data, availableStock: Number(data.availableStock), costPerUnit: Number(data.costPerUnit) }))}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Item Name</label>
                        <input {...register('name', { required: true })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Initial Stock</label>
                        <input type="number" {...register('availableStock', { required: true })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Cost Per Unit</label>
                        <input type="number" step="0.01" {...register('costPerUnit', { required: true })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel</button>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminExpenditure = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showItemModal, setShowItemModal] = useState(false);
  
  // Fetch Expenditures
  const { data: expenditures } = useQuery<Expenditure[]>({
      queryKey: ['expenditures', date],
      queryFn: async () => (await api.get(`/expenditure?date=${date}`)).data,
  });

  // Fetch Items for Inventory Tab
  const { data: items, refetch: refetchItems } = useQuery<{ _id: string, name: string, availableStock: number, costPerUnit: number }[]>({
      queryKey: ['adminItems'],
      queryFn: async () => (await api.get('/items')).data,
  });

  // Finalize Day
  const finalizeMutation = useMutation({
      mutationFn: async () => api.post('/expenditure/finalize', { date }),
      onSuccess: () => {
          alert('Day finalized successfully');
          queryClient.invalidateQueries({ queryKey: ['expenditures'] });
      }
  });

  // Export to Excel
  const handleExport = () => {
      const data = expenditures?.map(e => ({
          Date: new Date(e.date).toLocaleDateString(),
          Item: e.itemId?.name,
          Quantity: e.quantityUsed,
          CostPerUnit: e.itemId?.costPerUnit,
          TotalCost: e.quantityUsed * (e.itemId?.costPerUnit || 0),
          User: e.userId?.name,
          Status: e.finalized ? 'Finalized' : 'Pending'
      })) || [];

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Expenditure");
      XLSX.writeFile(wb, `Expenditure_${date}.xlsx`);
  };

  const [activeTab, setActiveTab] = useState<'daily' | 'inventory'>('daily');

  return (
    <div className="min-h-screen bg-gray-50">
       <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">StockTracker Admin</h1>
              <div className="ml-10 flex items-baseline space-x-4">
                  <button 
                    onClick={() => setActiveTab('daily')} 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'daily' ? 'bg-gray-900 text-white' : 'text-gray-900 hover:bg-gray-200'}`}
                  >
                      Daily Report
                  </button>
                  <button 
                    onClick={() => setActiveTab('inventory')} 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'inventory' ? 'bg-gray-900 text-white' : 'text-gray-900 hover:bg-gray-200'}`}
                  >
                      Inventory
                  </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
              <button onClick={logout} className="p-2 rounded-md hover:bg-gray-100">
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {activeTab === 'daily' ? (
              <>
                <div className="px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <input 
                            type="date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            className="border rounded p-2"
                        />
                        <button 
                            onClick={handleExport}
                            className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            <Download className="w-4 h-4 mr-2"/> Export Excel
                        </button>
                    </div>
                    <div className="space-x-2">
                        <button 
                            onClick={() => finalizeMutation.mutate()}
                            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            <CheckCircle className="w-4 h-4 mr-2"/> Finalize Day
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/Unit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {expenditures?.map((exp) => (
                                <tr key={exp._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{exp.itemId?.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{exp.quantityUsed}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">${exp.itemId?.costPerUnit}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">${exp.quantityUsed * (exp.itemId?.costPerUnit || 0)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{exp.userId?.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${exp.finalized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {exp.finalized ? 'Locked' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </>
          ) : (
              // Inventory View
              <>
                 <div className="px-4 py-4 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Inventory Items</h2>
                    <button 
                        onClick={() => setShowItemModal(true)}
                        className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        <PackagePlus className="w-4 h-4 mr-2"/> Add New Item
                    </button>
                 </div>
                 <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Per Unit</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {items?.map((item) => (
                                <tr key={item._id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.availableStock}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">${item.costPerUnit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
              </>
          )}
      </main>

      {showItemModal && (
          <ItemModal 
              onClose={() => setShowItemModal(false)}
              onSuccess={() => {
                  alert('Item added');
                  refetchItems();
              }}
          />
      )}
    </div>
  );
};

export default AdminExpenditure;
