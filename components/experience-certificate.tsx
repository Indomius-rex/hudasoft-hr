'use client';

export default function ExperienceCertificate({ employee, companyName }: { employee: any, companyName: string }) {
  const today = new Date();
  const joinDate = new Date(employee.joined_on);
  
  // Duration calculate karo (Years, Months)
  let years = today.getFullYear() - joinDate.getFullYear();
  let months = today.getMonth() - joinDate.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < joinDate.getDate())) {
    years--;
    months += 12;
  }
  const durationStr = `${years > 0 ? years + ' Year(s) ' : ''}${months} Month(s)`;

  const formattedJoinDate = joinDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedToday = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div id="print-certificate" style={{ 
      width: '100%',
      padding: '20px',
      background: '#fff',
      color: '#000',
      fontFamily: 'Arial, sans-serif',
      boxSizing: 'border-box',
      margin: '0 auto',
    }}>
      
      <h1 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '30px' }}>
        EXPERIENCE CERTIFICATE
      </h1>

      <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', marginBottom: '25px' }}>
        TO WHOM IT MAY CONCERN
      </h2>
      
      <p style={{ fontSize: '14px', lineHeight: '1.8', textAlign: 'justify', marginBottom: '15px' }}>
        This is to certify that <strong>Mr./Ms. {employee.name}</strong>, holding Employee ID <strong>{employee.employee_code}</strong>, 
        has been working with <strong>{companyName}</strong> as a <strong>{employee.designation}</strong> in the <strong>{employee.department}</strong> department 
        from <strong>{formattedJoinDate}</strong> to <strong>{formattedToday}</strong>.
      </p>
      
      <p style={{ fontSize: '14px', lineHeight: '1.8', textAlign: 'justify', marginBottom: '15px' }}>
        During his/her tenure of <strong>{durationStr}</strong>, we found him/her to be hardworking, honest, and dedicated to his/her duties. 
        His/her conduct and performance throughout this period have been excellent.
      </p>

      <p style={{ fontSize: '14px', lineHeight: '1.8', textAlign: 'justify', marginBottom: '25px' }}>
        We wish him/her all the best in his/her future endeavors.
      </p>
      
      <br/><br/>
      <div style={{ width: '200px' }}>
        <div style={{ borderBottom: '1px solid #000', marginBottom: '5px' }}></div>
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>Authorized Signature</p>
        <p style={{ margin: 0, fontSize: '13px' }}>{companyName}</p>
      </div>

    </div>
  );
}