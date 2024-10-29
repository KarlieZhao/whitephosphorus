import "../globals.css";

export default function ({ srcLink }: { srcLink: string }) {
    return (
        <div>
            <div className="text-white text-xl video-footage-wrapper ">
                <img
                    src={srcLink}
                    className="video-footage object-cover"
                    alt=""
                />
            </div>
        </div>
    );
}
