import { useState, useEffect } from "react";
import PurchaseController from "../controllers/PurchaseController";
import PaymentController from "../controllers/PaymentController";
import { getAuth } from "firebase/auth";

export default function CourseCard({ course, isAdmin }) {
  const auth = getAuth();
  const purchaseCtrl = new PurchaseController();
  const paymentCtrl = new PaymentController();
  const [owns, setOwns] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const check = async () => {
      if (!user) return;
      const has = await purchaseCtrl.userOwnsCourse(user.uid, course.id);
      setOwns(has);
    };
    check();
  }, [user]);

  const handleBuy = async () => {
    if (!user) return alert("Veuillez vous connecter");

    const pay = await paymentCtrl.startPayment(course.price, course.id, user.uid);

    if (pay.status === "success") {
      await purchaseCtrl.addPurchase(user.uid, course.id);
      alert("🎉 Paiement réussi ! Vous avez accès au cours.");
      setOwns(true);
    } else {
      alert("Erreur lors du paiement !");
    }
  };

  return (
    <div className="border p-4 rounded bg-white shadow flex flex-col justify-between h-full">
      <div>
        <h2 className="text-xl font-semibold">{course.title}</h2>
        <p>{course.description}</p>
        <p className="font-bold mt-2">{course.price} TND</p>
      </div>

      <div className="mt-3">
        {!isAdmin && (
          <>
            {owns ? (
              <button className="bg-green-600 text-white px-4 py-2 rounded w-full">
                ✔ Déjà acheté
              </button>
            ) : (
              <button
                onClick={handleBuy}
                className="bg-blue-600 text-white px-4 py-2 rounded w-full"
              >
                Acheter
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
