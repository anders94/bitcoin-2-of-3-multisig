#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <openssl/ec.h>
#include <openssl/obj_mac.h>
#include <openssl/bn.h>

int main(int argc, char *argv[]) {
  char prv_hex[64];
  EC_KEY *eckey = NULL;
  EC_POINT *pub_key = NULL;
  const EC_GROUP *group = NULL;
  BIGNUM start;
  BIGNUM *res;
  BN_CTX *ctx;

  strcpy(prv_hex, argv[1]);

  BN_init(&start);
  ctx = BN_CTX_new(); // ctx is an optional buffer to save time from allocating and deallocating memory whenever required

  res = &start;
  BN_hex2bn(&res,prv_hex);

  /*
  // anders
  BIO *out=NULL;
  out=BIO_new(BIO_s_file());
  if (out == NULL) exit(1);
  BIO_set_fp(out,stdout,BIO_NOCLOSE);
  BN_print(out,res);
  printf("\n");
  // anders
  */

  eckey = EC_KEY_new_by_curve_name(NID_secp256k1);
  group = EC_KEY_get0_group(eckey);
  pub_key = EC_POINT_new(group);

  EC_KEY_set_private_key(eckey, res);

  /* pub_key is a new uninitialized `EC_POINT*`.  priv_key res is a `BIGNUM*`. */
  if (!EC_POINT_mul(group, pub_key, res, NULL, NULL, ctx))
    printf("Error at EC_POINT_mul.\n");

  //assert(EC_POINT_bn2point(group, &res, pub_key, ctx)); // Null here

  EC_KEY_set_public_key(eckey, pub_key);

  char *cc = EC_POINT_point2hex(group, pub_key, 4, ctx);
  char *c = cc;
  int i;

  for (i=0; i<130; i++) { // 1 byte 0x42, 32 bytes for X coordinate, 32 bytes for Y coordinate
    printf("%c", *c++);
  }
  printf("\n");

  BN_CTX_free(ctx);
  free(cc);

  return 0;
}
