import { lusitana } from "../fonts";

const Heading = ({ title }: { title: string }) => {
    return (
        <>
            <div className="flex w-full items-center justify-between">
                <h1 className={`${lusitana.className} text-2xl`}>{title}</h1>
            </div></>
    );
}

export default Heading;