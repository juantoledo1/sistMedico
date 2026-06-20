from bson import ObjectId


def safe_object_id(id_str: str) -> ObjectId | str:
    try:
        return ObjectId(id_str)
    except Exception:
        return id_str
