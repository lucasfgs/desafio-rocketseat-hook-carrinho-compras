import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  // try {
  //   const updatedCart = [...cart];
  //   const productIndex = cart.findIndex(
  //     (product) => product.id === productId
  //   );

  //   const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

  //   const productAmount = cart[productIndex]?.amount || 1;

  //   if (stock.amount < productAmount) {
  //     toast.error("Quantidade solicitada fora de estoque");
  //     return;
  //   }

  //   const { data: product } = await api.get<Product>(
  //     `/products/${productId}`
  //   );

  //   if (productIndex === -1) {
  //     product.amount = productAmount;

  //     setCart([...cart, product]);
  //     localStorage.setItem(
  //       "@RocketShoes:cart",
  //       JSON.stringify([...cart, product])
  //     );
  //   } else {
  //     updatedCart[productIndex].amount += 1;

  //     if (stock.amount < updatedCart[productIndex].amount) {
  //       toast.error("Quantidade solicitada fora de estoque");
  //       return;
  //     }

  //     setCart([...updatedCart]);
  //     localStorage.setItem(
  //       "@RocketShoes:cart",
  //       JSON.stringify([...updatedCart])
  //     );
  //   }
  // } catch (err) {
  //   toast.error("Erro na adição do produto");
  // }
  const addProduct = async (productId: number) => {
    try {
      const productIndex = cart.findIndex(
        (product) => product.id === productId
      );

      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

      if (stock.amount < cart[productIndex]?.amount || stock.amount < 1) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productIndex === -1) {
        const { data: product } = await api.get<Product>(
          `/products/${productId}`
        );

        product.amount = 1;

        setCart([...cart, product]);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify([...cart, product])
        );
      } else {
        if (stock.amount > cart[productIndex].amount) {
          cart[productIndex].amount += 1;

          setCart([...cart]);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify([...cart]));
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productIndex = cart.findIndex(
        (product) => product.id === productId
      );

      if (productIndex === -1) throw productIndex;

      updatedCart.splice(productIndex, 1);

      setCart(updatedCart);
      localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify([...updatedCart])
      );
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

      if (stock.amount < amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updatedCart = cart;
      const productIndex = cart.findIndex(
        (product) => product.id === productId
      );

      updatedCart[productIndex].amount = amount;

      setCart([...updatedCart]);
      localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify([...updatedCart])
      );
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
