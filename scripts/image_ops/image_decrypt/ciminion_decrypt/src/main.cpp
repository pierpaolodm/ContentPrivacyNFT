#include "./main.h"
#include <nlohmann/json.hpp>
#include <fstream>
#include <typeinfo>

using json = nlohmann::json;

/**
 * Convert n bytes into a ZZ_p x, where x = sum(b[i]*256^i, i=0..n-1).
 *
 * @param bytes Pointer to a contiguous sequence of bytes. 
 * @param n The number of bytes of the sequence that we consider.
 * @return A ZZ_p object 
 */
ZZ_p ZZ_p_from_bytes(const uint8_t *bytes, long n)
{
	return to_ZZ_p(ZZFromBytes(bytes, n));
}

/**
 * Generate the round constants by applying SHAKE256 to msg and converting the
 * resulting bytes into an object of type T (either ZZ_p or ZZ_pE).
 *
 * @tparam T Type to work with. Either ZZ_p or ZZ_pE.
 * @param rc The vector which contains the round constants upon completion. 
 * @param convert A pointer to a function to convert the bytes into objects of type T.
 * @param msg The input message to SHAKE256.
 */
template <class T>
void initialize_round_constants(Vec<T> &rc, T (*convert)(const uint8_t *, long), const string &msg)
{
	// Generate byte sequence 
	uint8_t digest[DIGESTSIZE];
	FIPS202_SHAKE256((const uint8_t *) msg.c_str(), msg.size(), digest, DIGESTSIZE);

	// Convert bytes to elements of T and store them into rc.
	for (long i = 0; i < NUMBER_OF_ROUND_CONSTANTS_N; i++) {
		T c = (*convert)(digest + i*ELEMENTSIZE_IN_BYTES, ELEMENTSIZE_IN_BYTES);
		// IMPORTANT: all of the round constants we found were non-zero and not
		// equal to one, hence we did not need to filter anything.
		rc[i] = c;
	}
}




// make >/dev/null  && make install >/dev/null  && ./bin/main ./example.json 2 2134 3423412331 && make clean >/dev/null
// make>/dev/null && make install >/dev/null && ./bin/main ./example.json ciphertext_len master_key[0] master_key[1] && make clean >/dev/null



int main(int argc, char* argv[]) {
	// Set the modulus
	// Define the same prime as in circom circuits (see GLOBAL_FIELD_P in  circom)
	string prime = "21888242871839275222246405745257275088548364400416034343698204186575808495617";
	ZZ_p::init(conv<ZZ>((const char *) prime.c_str()));


    // Verify that the user specified the path to the JSON file
    if (argc < 5) {
        std::cerr << "It must be specified only the json file path, ciphertext len, master_key[0] and master_key[1]" << std::endl;
        return 1;
    }

	// Open the file containing the JSON
    std::ifstream file(argv[1]);
    if (!file.is_open()) {
        std::cerr << "Unable to open json file." << std::endl;
        return 1;
    }

	// Setup the ciphertexts from the JSON file
	long unsigned int ciphertext_len = std::atoi(argv[2]);
	Vec<ZZ_p> cipher_text;
	cipher_text.SetLength(ciphertext_len);

	// Setup the tag, nonce and initialization vector (IV) from the JSON file
	ZZ_p tag;
	ZZ_p nonce;
	ZZ_p IV;

	// Read the master key from the command line
	Vec<ZZ_p> MK;
	MK.SetLength(2);
	MK[0] = to_ZZ_p(conv<ZZ>(argv[3]));
	MK[1] = to_ZZ_p(conv<ZZ>(argv[4]));




	// Parse the JSON file
	std::string jsonStr((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    try {
        json jsonData = json::parse(jsonStr);
        if (!jsonData.is_array()) {
            std::cerr << "Json file is not correctly formatted" << std::endl;
            return 1;
        }

		
        std::vector<std::string> data = jsonData;
		if(data.size() < ciphertext_len) {
			std::cerr << "Ciphertext len is greater than the number of ciphertexts in the json file" << std::endl;
			return 1;
		}

		//inizialize the ciphertexts, tag, nonce and IV
		long unsigned int i = 1;
        for (; i < ciphertext_len + 1; i++)
			cipher_text[i-1] = to_ZZ_p(conv<ZZ>(data[i].c_str()));
		tag = to_ZZ_p(conv<ZZ>(data[i++].c_str()));
		nonce = to_ZZ_p(conv<ZZ>(data[data.size() - 4].c_str()));
		IV = to_ZZ_p(conv<ZZ>(data[data.size() - 3].c_str()));

    }
    catch (const json::exception& e) {
        std::cerr << "Error during json parsing " << e.what() << std::endl;
        return 1;
    }

	// Generate round constants
	Vec<ZZ_p> rcs_n;
	rcs_n.SetLength(NUMBER_OF_ROUND_CONSTANTS_N);
	string msg = "GF(" + prime + ")";
	initialize_round_constants<ZZ_p>(rcs_n, &ZZ_p_from_bytes, msg);
	Vec<ZZ_p> rcs_r;
	rcs_r.SetLength(NUMBER_OF_ROUND_CONSTANTS_R);
	for (long i = 0; i < NUMBER_OF_ROUND_CONSTANTS_R; i++) {
		rcs_r[i] = rcs_n[START_R + i];
	}

	// Instantiate the permutations, rolling function, and farfalle-like construction
	IteratedTransformation<ZZ_p> p_n(NUMBER_OF_ROUNDS_N, rcs_n);
	IteratedTransformation<ZZ_p> p_r(NUMBER_OF_ROUNDS_R, rcs_r);
	RollingFunction<ZZ_p> roll;
	FarfalleLike<ZZ_p> ciminion(p_n, p_r, roll, IV);

	// Decrypt the ciphertext

	Vec<ZZ_p> Mseq_dec = ciminion.decrypt(MK, nonce, cipher_text, tag);
	
	// Print the decrypted message as a vector
	cout << "[";
	for (long unsigned int i = 0; i < ciphertext_len - 1; i++)
    	cout << Mseq_dec[i] << ",";
	cout << Mseq_dec[ciphertext_len - 1] << "]";


	return 0;
	
}

