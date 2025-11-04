import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import confirmIcon from '/icons/confirmIcon.png'
const ThankYou = () => {
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { orderNumber, estimatedTime } = location.state || {};

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className='thankyou'>
      <div className="thankyou-page">
      <div className="thankyou-content">
        <h1>Thanks For Ordering</h1>
        <div className="success-icon">
          <img src={confirmIcon} alt="" />
        </div>
        <div className="redirect-info">
          <p>Redirecting in {countdown}</p>
        </div>
      </div>
    </div>
    </div>
    
  );
};

export default ThankYou;
