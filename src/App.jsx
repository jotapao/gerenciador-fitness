import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged,
    signInWithCustomToken
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    onSnapshot, 
    updateDoc, 
    deleteDoc,
    serverTimestamp,
    query,
    where
} from 'firebase/firestore';
import { setLogLevel } from "firebase/firestore";


// --- ÍCONES (SVG) ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const PackageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"/><path d="M19 13.3a9 9 0 1 1-14 0"/><path d="M12 17.8v-1.8"/><path d="m7 10.5 2.5 2.5"/><path d="m17 10.5-2.5 2.5"/></svg>;
const ShoppingCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16"/></svg>;
const DollarSignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>;
const Trash2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const AlertTriangleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;


// --- CONFIGURAÇÃO DO FIREBASE ---
// As variáveis __firebase_config, __app_id e __initial_auth_token são injetadas pelo ambiente.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- COMPONENTES DA UI ---

const StatCard = ({ title, value, children, colorClass = 'bg-blue-500' }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-4 transform hover:scale-105 transition-transform duration-300">
        <div className={`p-3 rounded-full text-white ${colorClass}`}>
            {children}
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 m-4 max-w-lg w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                </button>
                {children}
            </div>
        </div>
    );
};


// --- COMPONENTES DE GERENCIAMENTO ---

function Dashboard({ products, sales, expenses, userId }) {
    const stats = useMemo(() => {
        const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalRevenue, 0);
        const totalProfit = sales.reduce((acc, sale) => acc + sale.profit, 0);
        const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
        const netProfit = totalProfit - totalExpenses;
        return { totalRevenue, totalProfit, totalExpenses, netProfit };
    }, [sales, expenses]);

    const lowStockProducts = useMemo(() => {
        return products.filter(p => p.quantity <= 5).sort((a, b) => a.quantity - b.quantity);
    }, [products]);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Painel de Controle</h2>
                <p className="text-gray-500">Seu ID de compartilhamento: <span className="font-mono bg-gray-100 p-1 rounded">{userId}</span></p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Lucro Líquido" value={`R$ ${stats.netProfit.toFixed(2)}`} colorClass="bg-green-500">
                    <DollarSignIcon />
                </StatCard>
                <StatCard title="Total de Vendas" value={`R$ ${stats.totalRevenue.toFixed(2)}`} colorClass="bg-blue-500">
                    <ShoppingCartIcon />
                </StatCard>
                <StatCard title="Lucro Bruto (Vendas)" value={`R$ ${stats.totalProfit.toFixed(2)}`} colorClass="bg-yellow-500">
                     <DollarSignIcon />
                </StatCard>
                <StatCard title="Total de Despesas" value={`R$ ${stats.totalExpenses.toFixed(2)}`} colorClass="bg-red-500">
                     <DollarSignIcon />
                </StatCard>
            </div>

            {lowStockProducts.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold text-red-600 flex items-center"><AlertTriangleIcon className="mr-2"/>Atenção: Estoque Baixo</h3>
                    <p className="text-gray-600 mb-4">Os seguintes produtos precisam de reposição:</p>
                    <ul className="space-y-2">
                        {lowStockProducts.map(p => (
                            <li key={p.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                <span className="font-medium text-gray-800">{p.name}</span>
                                <span className="font-bold text-red-700 bg-red-200 px-3 py-1 rounded-full text-sm">{p.quantity} unid.</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function ProductsManager({ db, userId }) {
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({ name: '', costPrice: '', salePrice: '', quantity: '' });

    useEffect(() => {
        if (!db || !userId) return;
        const productsCollection = collection(db, 'artifacts', appId, 'users', userId, 'products');
        const unsubscribe = onSnapshot(productsCollection, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productsData);
        });
        return () => unsubscribe();
    }, [db, userId]);

    const handleOpenModal = (product = null) => {
        setEditingProduct(product);
        setFormData(product ? { ...product } : { name: '', costPrice: '', salePrice: '', quantity: '' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({ name: '', costPrice: '', salePrice: '', quantity: '' });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!db || !userId) return;
        
        const productData = {
            name: formData.name,
            costPrice: parseFloat(formData.costPrice),
            salePrice: parseFloat(formData.salePrice),
            quantity: parseInt(formData.quantity, 10),
            lastUpdated: serverTimestamp()
        };

        const productsCollection = collection(db, 'artifacts', appId, 'users', userId, 'products');

        try {
            if (editingProduct) {
                const productDoc = doc(db, 'artifacts', appId, 'users', userId, 'products', editingProduct.id);
                await updateDoc(productDoc, productData);
            } else {
                productData.createdAt = serverTimestamp();
                await addDoc(productsCollection, productData);
            }
            handleCloseModal();
        } catch (error) {
            console.error("Erro ao salvar produto:", error);
        }
    };

    const handleDelete = async (productId) => {
        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
            try {
                const productDoc = doc(db, 'artifacts', appId, 'users', userId, 'products', productId);
                await deleteDoc(productDoc);
            } catch (error) {
                console.error("Erro ao excluir produto:", error);
            }
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gerenciar Produtos</h2>
                <button onClick={() => handleOpenModal()} className="flex items-center bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 transition-colors">
                    <PlusCircleIcon className="mr-2"/> Adicionar Produto
                </button>
            </div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Custo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Venda</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {product.costPrice.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {product.salePrice.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => handleOpenModal(product)} className="text-indigo-600 hover:text-indigo-900"><EditIcon /></button>
                                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900"><Trash2Icon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                <h3 className="text-xl font-bold mb-4">{editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nome do Produto" className="w-full p-3 border border-gray-300 rounded-lg" required />
                    <input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange} placeholder="Preço de Custo" className="w-full p-3 border border-gray-300 rounded-lg" required step="0.01" />
                    <input type="number" name="salePrice" value={formData.salePrice} onChange={handleChange} placeholder="Preço de Venda" className="w-full p-3 border border-gray-300 rounded-lg" required step="0.01" />
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Quantidade em Estoque" className="w-full p-3 border border-gray-300 rounded-lg" required step="1" />
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600">{editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function SalesManager({ db, userId, products }) {
    const [sales, setSales] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ productId: '', quantity: 1 });
    const [error, setError] = useState('');

    useEffect(() => {
        if (!db || !userId) return;
        const salesCollection = collection(db, 'artifacts', appId, 'users', userId, 'sales');
        const unsubscribe = onSnapshot(salesCollection, (snapshot) => {
            const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSales(salesData.sort((a, b) => b.date.seconds - a.date.seconds));
        });
        return () => unsubscribe();
    }, [db, userId]);

    const handleOpenModal = () => {
        setError('');
        setFormData({ productId: products.length > 0 ? products[0].id : '', quantity: 1 });
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setError('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!db || !userId || !formData.productId) {
            setError('Selecione um produto.');
            return;
        }

        const product = products.find(p => p.id === formData.productId);
        const quantitySold = parseInt(formData.quantity, 10);

        if (!product) {
            setError('Produto não encontrado.');
            return;
        }

        if (product.quantity < quantitySold) {
            setError(`Estoque insuficiente. Apenas ${product.quantity} unidades disponíveis.`);
            return;
        }

        const totalRevenue = product.salePrice * quantitySold;
        const totalCost = product.costPrice * quantitySold;
        const profit = totalRevenue - totalCost;

        const saleData = {
            productId: product.id,
            productName: product.name,
            quantity: quantitySold,
            salePrice: product.salePrice,
            costPrice: product.costPrice,
            totalRevenue,
            totalCost,
            profit,
            date: serverTimestamp(),
        };

        try {
            // Add sale record
            const salesCollection = collection(db, 'artifacts', appId, 'users', userId, 'sales');
            await addDoc(salesCollection, saleData);

            // Update product stock
            const productDoc = doc(db, 'artifacts', appId, 'users', userId, 'products', product.id);
            await updateDoc(productDoc, {
                quantity: product.quantity - quantitySold
            });

            handleCloseModal();
        } catch (err) {
            console.error("Erro ao registrar venda:", err);
            setError('Ocorreu um erro. Tente novamente.');
        }
    };

    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Registrar Vendas</h2>
                <button onClick={handleOpenModal} className="flex items-center bg-green-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-600 transition-colors">
                    <PlusCircleIcon className="mr-2"/> Nova Venda
                </button>
            </div>
             <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Venda</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lucro</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sales.map(sale => (
                            <tr key={sale.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sale.date?.seconds * 1000).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.productName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">R$ {sale.totalRevenue.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">R$ {sale.profit.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                <h3 className="text-xl font-bold mb-4">Registrar Nova Venda</h3>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <select name="productId" value={formData.productId} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg">
                        <option value="">-- Selecione um produto --</option>
                        {products.filter(p => p.quantity > 0).map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Estoque: {p.quantity})</option>
                        ))}
                    </select>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Quantidade" className="w-full p-3 border border-gray-300 rounded-lg" required min="1"/>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600">Registrar Venda</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function ExpensesManager({ db, userId }) {
    const [expenses, setExpenses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ description: '', amount: '' });

    useEffect(() => {
        if (!db || !userId) return;
        const expensesCollection = collection(db, 'artifacts', appId, 'users', userId, 'expenses');
        const unsubscribe = onSnapshot(expensesCollection, (snapshot) => {
            const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExpenses(expensesData.sort((a, b) => b.date.seconds - a.date.seconds));
        });
        return () => unsubscribe();
    }, [db, userId]);

    const handleOpenModal = () => {
        setFormData({ description: '', amount: '' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!db || !userId) return;
        
        const expenseData = {
            description: formData.description,
            amount: parseFloat(formData.amount),
            date: serverTimestamp()
        };

        try {
            const expensesCollection = collection(db, 'artifacts', appId, 'users', userId, 'expenses');
            await addDoc(expensesCollection, expenseData);
            handleCloseModal();
        } catch (error) {
            console.error("Erro ao adicionar despesa:", error);
        }
    };
    
    const handleDelete = async (expenseId) => {
        if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
            try {
                const expenseDoc = doc(db, 'artifacts', appId, 'users', userId, 'expenses', expenseId);
                await deleteDoc(expenseDoc);
            } catch (error) {
                console.error("Erro ao excluir despesa:", error);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gerenciar Despesas</h2>
                <button onClick={handleOpenModal} className="flex items-center bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-red-600 transition-colors">
                    <PlusCircleIcon className="mr-2"/> Adicionar Despesa
                </button>
            </div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {expenses.map(expense => (
                            <tr key={expense.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(expense.date?.seconds * 1000).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">R$ {expense.amount.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-900"><Trash2Icon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                <h3 className="text-xl font-bold mb-4">Adicionar Nova Despesa</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Descrição da Despesa" className="w-full p-3 border border-gray-300 rounded-lg" required />
                    <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="Valor da Despesa" className="w-full p-3 border border-gray-300 rounded-lg" required step="0.01" />
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600">Adicionar Despesa</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}


// --- COMPONENTE PRINCIPAL (APP) ---

export default function App() {
    const [view, setView] = useState('dashboard');
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // Data states
    const [products, setProducts] = useState([]);
    const [sales, setSales] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initialize Firebase
    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const firebaseAuth = getAuth(app);
            setDb(firestoreDb);
            setAuth(firebaseAuth);
            setLogLevel('error'); // 'debug' para ver todos os logs
        } catch (e) {
            console.error("Firebase initialization failed", e);
            if (Object.keys(firebaseConfig).length === 0) {
                 console.error("Firebase config is empty. Ensure __firebase_config is provided.");
            }
        }
    }, []);

    // Handle Authentication
    useEffect(() => {
        if (!auth) return;
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                setIsAuthReady(true);
            } else {
                try {
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Authentication failed:", error);
                    setIsAuthReady(true); // Proceed even if auth fails, with userId=null
                }
            }
        });
        return () => unsubscribe();
    }, [auth]);

    // Fetch all data once auth is ready
    useEffect(() => {
        if (!isAuthReady || !db || !userId) {
            if (isAuthReady) setLoading(false);
            return;
        }

        setLoading(true);
        const collections = {
            products: collection(db, 'artifacts', appId, 'users', userId, 'products'),
            sales: collection(db, 'artifacts', appId, 'users',userId, 'sales'),
            expenses: collection(db, 'artifacts', appId, 'users', userId, 'expenses')
        };

        const unsubProducts = onSnapshot(collections.products, snap => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubSales = onSnapshot(collections.sales, snap => setSales(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubExpenses = onSnapshot(collections.expenses, snap => setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        
        setLoading(false);

        return () => {
            unsubProducts();
            unsubSales();
            unsubExpenses();
        };
    }, [isAuthReady, db, userId]);

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard products={products} sales={sales} expenses={expenses} userId={userId} />;
            case 'products':
                return <ProductsManager db={db} userId={userId} />;
            case 'sales':
                return <SalesManager db={db} userId={userId} products={products} />;
            case 'expenses':
                return <ExpensesManager db={db} userId={userId} />;
            default:
                return <Dashboard products={products} sales={sales} expenses={expenses} userId={userId} />;
        }
    };

    const NavButton = ({ viewName, icon, label }) => {
        const isActive = view === viewName;
        return (
            <button
                onClick={() => setView(viewName)}
                className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start space-x-0 sm:space-x-3 px-3 py-2 rounded-lg transition-all duration-200 w-full text-left ${
                    isActive
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
            >
                {icon}
                <span className="text-sm sm:text-base font-medium mt-1 sm:mt-0">{label}</span>
            </button>
        );
    };
    
    if (!isAuthReady || loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <div className="text-center">
                    <p className="text-xl font-semibold">Carregando seu gerenciador...</p>
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500 mx-auto mt-4"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <div className="flex flex-col lg:flex-row">
                {/* Navegação Lateral */}
                <aside className="bg-white lg:w-64 p-4 lg:p-6 lg:min-h-screen border-b lg:border-r border-gray-200">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="p-2 bg-blue-500 rounded-lg text-white">
                           <PackageIcon />
                        </div>
                        <h1 className="text-xl font-bold text-gray-800">Gestor Fitness</h1>
                    </div>
                    <nav className="space-y-2">
                        <NavButton viewName="dashboard" label="Painel" icon={<HomeIcon />} />
                        <NavButton viewName="products" label="Produtos" icon={<PackageIcon />} />
                        <NavButton viewName="sales" label="Vendas" icon={<ShoppingCartIcon />} />
                        <NavButton viewName="expenses" label="Despesas" icon={<DollarSignIcon />} />
                    </nav>
                </aside>

                {/* Conteúdo Principal */}
                <main className="flex-1 p-6 lg:p-10">
                    {renderView()}
                </main>
            </div>
        </div>
    );
}
