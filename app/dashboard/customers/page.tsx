'use client';
import { getCustomerData } from '@/app/actions/getCustomerData';
import { Customer } from '@/app/lib/models';
import { useEffect, useState } from 'react';

const Customers = () => {

    const [users, setUsers] = useState<Customer[]>([]);

    useEffect(() => {
        fetchCustomer();
    }, []);

    const fetchCustomer = async () => {
        const data: Customer[] = await getCustomerData();  // Call the server action
        setUsers(data);
    }


    return <>Customers Page</>
}

export default Customers;